var infowindow, geocoder, map;
var chosenPlaces = [];
var placesToSend = [];
var numOfPlaces = 0;
var directionsService;
var directionsDisplay;
var trip = [];
var lineCoordinates = [];
var line;
var shownLines = [];
var shownRouteMarkers = [];


$(document).ready(function () {
    var address = decodeURIComponent(location.pathname.split('/')[3]);
    document.getElementById("address").setAttribute("value", address);

    document.getElementById('createRouteBtn').addEventListener('click', function () {
        
        if ($("#startPlace").val() == "" || $("#endPlace").val() == "" || $("#duration").val() == ""){

            $("<div><p>Необходимо указать начальную и конечную точки маршрута</p></div>")
            .addClass("dialog")
            .appendTo("body")
            .dialog({
                title: "Предупреждение",
                close: function () { $(this).remove() },
                modal: true,
                width: 500,
                closeText: "X"
            })
            .load(this.href);
        }
        else {
            if (chosenPlaces.length > $("#duration").val() * 8) {

                var dialog = "<div><p>Вы превысили допустимое количество промежуточных точек в маршруте.<br />Увеличьте количество дней или выберите меньше мест.</p></div>"
                $(dialog)
                .addClass("dialog")
                .appendTo("body")
                .dialog({
                    title: "Предупреждение",
                    close: function () { $(this).remove() },
                    modal: true,
                    width: 500,
                    closeText: "X"
                })
                .load(this.href);
            }
            else {
                if (chosenPlaces.length == 0) {
                    var dialog = "<div><p>Вы не выбрали ни одно место.</p></div>"
                    $(dialog)
                    .addClass("dialog")
                    .appendTo("body")
                    .dialog({
                        title: "Предупреждение",
                        close: function () { $(this).remove() },
                        modal: true,
                        width: 500,
                        closeText: "X"
                    })
                    .load(this.href);
                }
                else {
                    trip = [];
                    //очищаем карту от линий и маркеров на маршруте
                    deleteRouteMarkersAndLines();

                    sendCoordinates();
                    document.getElementById("scrollToMap").click();
                }
            }
        }
    });

    document.getElementById('saveRouteBtn').addEventListener('click', function () {
        sendTrip();
    });

    document.getElementById('startEquelEnd').addEventListener('click', function () {
        if ($(this).is(":checked")) {
            document.getElementById('endPlace').value = document.getElementById('startPlace').value;
        }
        else {
            document.getElementById('endPlace').value = "";
        }
    });
    
    $(".close").on("click", function (e) {
        e.preventDefault();
        $(this).closest(".dialog").dialog("close");
    });
})

function getAddressName(address)
{
    var result = "";
    var index = address.length - 1;

    if (address[0] == "В") {
        result = "Добро пожаловать во ";
    }
    else {
        result = "Добро пожаловать в ";
    }

    if (address[index] == 'а') {
        result = result + address.slice(0, index) + "y" + "!";
    }
    else {
        if (address[index] == 'я') {
            result = result + address.slice(0, index) + "ю" + "!";
        }
        else {
            result = result + address + "!";
        }
    }
    
    return result;
}

//инициализация карты (вызывается после загрузки библиотеки)
function initMap() {
    infowindow = new google.maps.InfoWindow();
    geocoder = new google.maps.Geocoder();
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 57, lng: 40.983333 },
        zoom: 8
    });

    directionsService = new google.maps.DirectionsService;
    directionsDisplay = new google.maps.DirectionsRenderer;

    directionsDisplay.setMap(map);    

    var autocompleteStart = new google.maps.places.Autocomplete(
       document.getElementById('startPlace'), { types: ['address'] });

    var autocompleteEnd = new google.maps.places.Autocomplete(
      document.getElementById('endPlace'), { types: ['address'] });

    var autocomplete = new google.maps.places.Autocomplete(
        document.getElementById('addressGo'),
        { types: ['(cities)'] });

    //вызов функции поиска мест
    findPlaces();
}

//поиск заданного места и мест поблизости
function findPlaces() {
    address = decodeURIComponent(location.pathname.split('/')[3]);

    geocoder.geocode({ 'address': address }, function (results, status) {
        if (status === google.maps.GeocoderStatus.OK) {
            document.getElementById("addressName").innerHTML = getAddressName(results[0].address_components[0].long_name);
            document.getElementById("address").setAttribute("value", results[0].formatted_address);

            // поиск мест поблизости в пределах radius от заданной точки location
            var request = {
                location: results[0].geometry.location,
                radius: '30000',
                types: ['art_gallery', 'hindu_temple', 'mosque', 'museum', 'park', 'synagogue', 'zoo', 'theatre'],
                rankBy: google.maps.places.RankBy.PROMINENCE
            };

            service = new google.maps.places.PlacesService(map);
            service.radarSearch(request, processResults);
        }
        else {
            $("#loading").hide();
            $("#content").hide();
            $("#onemoreInput").show();
        }
    });
}


//обработка результатов метода nearbySearch
function processResults(results, status) {
    if (status !== google.maps.places.PlacesServiceStatus.OK) {
        $("#loading").hide();
        $("#content").hide();
        $("#onemoreInput").show();
    }
    else {

        map.setCenter(results[0].geometry.location);
        map.setZoom(14);

        var moreBtn = document.getElementById("moreBtn");
        if (results.length <= 8) {
            moreBtn.disabled = true;
        }

        //создаем маркеры на карте
        var bounds = new google.maps.LatLngBounds();
        for (var i = 0; i < results.length; i++) {
            createMarker(results[i]);
            bounds.extend(results[i].geometry.location);
        }
        map.fitBounds(bounds);

        for (var i = numOfPlaces; i < (numOfPlaces+8) && i<results.length; i++) {
            getDetails(results[i]);
        }
        numOfPlaces = i;
        if (i == results.length)
        {
            moreBtn.disabled = true;
        }

        moreBtn.addEventListener('click', function () {
            $("#loading").show();
            for (var i = numOfPlaces; i < (numOfPlaces + 8) && i < results.length; i++) {
                getDetails(results[i], results.length-numOfPlaces);
            }
            numOfPlaces = i;
            if (i == results.length) {
                moreBtn.disabled = true;
            }
        });
    }
}

//отрисовка маркеров
function createMarker(place) {

    var marker = new google.maps.Marker({
        map: map,
        position: place.geometry.location,
        //title: place.name,
        icon: {
            url: 'http://maps.gstatic.com/mapfiles/circle.png',
            anchor: new google.maps.Point(10, 10),
            scaledSize: new google.maps.Size(10, 17)
        }
    });

    google.maps.event.addListener(marker, 'click', function () {
        service.getDetails(place, function (result, status) {
            //если все хорошо, сохраняем данные о месте в resultPlace
            if (status == google.maps.places.PlacesServiceStatus.OK) {
                infowindow.setContent(result.name);
            }
            else infowindow.setContent("Данные не найдены");
            infowindow.open(map, marker);
        });
    });
}

function getDetails(place, mod) {
    var moreBtn = document.getElementById("moreBtn");
    moreBtn.disabled = true;

    //запрос данных об объекте place
    service.getDetails(place, function (result, status) {

        //если все хорошо, выводим новый элемент 
        if (status == google.maps.places.PlacesServiceStatus.OK) {
            
            placesToSend.push(getPlaceDetails(result));

            if (mod < 8) {
                if (placesToSend.length == mod) {
                    sendPlaces(placesToSend);
                }
            }
            else {
                if (placesToSend.length == 8) {
                    moreBtn.disabled = false;
                    sendPlaces(placesToSend);
                }
            }
            
        } else {
            setTimeout(function () {
                getDetails(place);
            }, 500);
        }
    });
}

//сборка JSON для отправки результатов поиска на сервер для отображения
function getPlaceDetails(place) {
    var openHours, reviews = [], review, rating, photoUrl, website;

    //сборка JSON
    if (place.opening_hours) {
        openHours = place.opening_hours.weekday_text;
    }
    else
        openHours = null;

    if (place.reviews) {
        for (var i = 0; i < place.reviews.length; i++) {
            review = { 'AuthorName': place.reviews[i].author_name, 'Text': place.reviews[i].text, 'Rating': place.reviews[i].rating };
            reviews.push(review);
        }
    }
    else
        reviews = null;

    if (place.rating) {
        rating = place.rating;
    }
    else
        rating = null;

    if (place.photos) {
        photoUrl = place.photos[0].getUrl({ 'maxWidth': 350, 'maxHeight': 200 });
    }
    else
        photoUrl = null;   

    if (place.website) {
        website = place.website;
    }
    else
        website = null;

    var placeToSend = {
        'Value': place.geometry.location + "|" + place.place_id,
        'Name': place.name,
        'Address': place.vicinity,
        'OpeningHours': openHours,
        'Reviews': reviews,
        'PhotoUrl': photoUrl,
        'Rating': rating,
        'Website': website
    };

    return placeToSend;
}

//отправка ajax-запроса на сервер с результатами поиска для отображения
function sendPlaces(placesToSend) {
    //url: /Route/Index
    var url = document.getElementById("PlaceBlocksUrl").value;

    $.ajax({
        type: 'POST',
        url: url,
        data: JSON.stringify(placesToSend),
        contentType: "application/json",
        dataType: "html",
        success: function (data) {
            $("#loading").hide();
            $(data).insertBefore($("#moreBtn"));

            placesToSend.splice(0, placesToSend.length);           

            var checkboxes = [];
            checkboxes = $(".place:gt(-9)");

            //добавление анимации полета в корзину при выборе места 
            for (var i = 0; i < checkboxes.length; i++) {
                var x = checkboxes[i];

                x.addEventListener("click", function () {
                    var t = $(this)[0];

                    if ($(this).is(":checked")) {
                        chosenPlaces.push(t);
                        $(this).parent()
                        .clone()
                        .css({ 'position': 'absolute', 'z-index': '11100', top: $(this).offset().top, left: $(this).offset().left })
                        .appendTo("#places")
                        .animate({
                            opacity: 0.1,
                            left: $("#chosenPlaces").offset()['left'],
                            top: $("#chosenPlaces").offset()['top'],
                            width: 20
                        }, 500, function () {
                            $(this).remove();
                            //увеличение счетчика мест при добавлении очередного места
                            var number = parseInt($("#chosenPlaces > h2").text());
                            $("#chosenPlaces > h2").text("  " + (number + 1));
                        });
                    }
                    else {
                        //уменьшение счетчика мест при удалении очередного места
                        var number = parseInt($("#chosenPlaces > h2").text());
                        $("#chosenPlaces > h2").text("  " + (number - 1));
                        chosenPlaces.splice(chosenPlaces.indexOf(t), 1);
                    }
                });

            }
        }
    });
}


//отрисовка построенного маршрута
function showRoute(response, dayRoute, day) {

    var colors = ['#4169E0', '#FFA500', '#32CD32', '#FF0000', '#800080', '#191970', '#BA55D3', '#FF69B4', '#FFFF00', '#008B8B'];    

    if (day == 1)
    {
        //добавление маркера для начальной точки
        var marker = new google.maps.Marker({
            position: response.routes[0].legs[0].start_location,
            map: map
        });

        google.maps.event.addListener(marker, 'click', function () {
            infowindow.setContent(document.getElementById("startPlace").value);
            infowindow.open(map, marker);
        });

        if (response.routes[0].legs[0].start_location != response.routes[0].legs[response.routes[0].legs.length-1].end_location) {
            //добавление маркера для конечной точки
            var marker = new google.maps.Marker({
                position: response.routes[0].legs[response.routes[0].legs.length-1].end_location,
                map: map
            });

            google.maps.event.addListener(marker, 'click', function () {
                infowindow.setContent(document.getElementById("endPlace").value);
                infowindow.open(map, marker);
            });
        }
    }    

    //перебор всех ребер маршрута (legs)
    for (var i = 0; i < response.routes[0].legs.length; i++) {

        if (i > 0)
        {
            //добавление маркера в начало ребра
            addMarker(response.routes[0].legs[i].start_location, i, dayRoute[i - 1].PlaceId);
        }

        //перебор всех шагов ребра (steps)
        for (var j = 0; j < response.routes[0].legs[i].steps.length; j++) {
            //lineCoordinates.push(response.routes[0].legs[i].steps[j].path);
            Array.prototype.push.apply(lineCoordinates, response.routes[0].legs[i].steps[j].path);
        }
    }

    line = new google.maps.Polyline({
        path: lineCoordinates,
        geodesic: true,
        strokeColor: colors[day-1],
        strokeOpacity: 0.8,
        strokeWeight: 5
    });

    line.setMap(map);

    shownLines.push(line);

    //очищаем массив lineCoordinates
    lineCoordinates.splice(0, lineCoordinates.length);
}

//добавление маркера в маршрут
function addMarker(location, labelIndex, placeId) {
    var marker = new google.maps.Marker({
        position: location,
        label: labelIndex.toString(),
        map: map
    });

    google.maps.event.addListener(marker, 'click', function () {

        service.getDetails({ 'placeId': placeId }, function (result, status) {
            //если все хорошо, сохраняем данные о месте в resultPlace
            if (status == google.maps.places.PlacesServiceStatus.OK) {
                //добавляем маркеру событие нажатия
                infowindow.setContent(result.name);
            }
            else infowindow.setContent("Данные не найдены");
            infowindow.open(map, marker);
        });
    });

    shownRouteMarkers.push(marker);
}

//составление строки маршрута - промежуточные точки в оптимизированном порядке
function getPath(order) {

    var waypts = chosenPlaces.slice(1, chosenPlaces.length - 1);
    var str_arr = [];

    var path = "";
    var placesId = "";

    //запись начальной точки маршрута
    str_arr = chosenPlaces[0].value.split('|');
    path = path.concat(str_arr[0] + "/");
    placesId = placesId.concat(str_arr[1] + "/");

    service.getDetails({ 'placeId': str_arr[1] }, function (result, status) {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
            if (result.photos) {
                var photoUrl = result.photos[0].getUrl({ 'maxWidth': 368, 'maxHeight': 256 });
                document.getElementById("photoUrl").setAttribute("value", photoUrl);
            }
            else console.log("no photo");
        }
        else console.log("no place");
    });


    //запись промежуточных точек маршрута в оптимизированном порядке
    for (var i = 0; i < order.length; i++) {
        str_arr = waypts[order[i]].value.split('|');
        path = path.concat(str_arr[0] + "/");
        placesId = placesId.concat(str_arr[1] + "/");
    }

    //запись конечной точки маршрута
    str_arr = chosenPlaces[chosenPlaces.length - 1].value.split('|');
    path = path.concat(str_arr[0]);
    placesId = placesId.concat(str_arr[1]);


    console.log(path);
    console.log(placesId);
    document.getElementById("path").setAttribute("value", path);
    document.getElementById("placesId").setAttribute("value", placesId);


    return placesId.split('/');
}


//////////////////////////////



//посылает координаты выбранных точек для разбивки их на области
function sendCoordinates() {
    var str_arr = [];

    for (i in chosenPlaces) {        
        str_arr.push(chosenPlaces[i].value);
    }
        
    $.ajax({
        type: 'POST',
        url: "/Route/Count",
        data: JSON.stringify({
            'Points': str_arr,
            'Days': document.getElementById("duration").value
        }),
        contentType: "application/json",
        dataType: "text",
        success: function (data) {
            var model = JSON.parse(JSON.parse(data));
            console.log(model);

            //получаем фото для профиля путешествия
            service.getDetails({ 'placeId': model[0][0].PlaceId }, function (result, status) {
                if (status === google.maps.places.PlacesServiceStatus.OK) {
                    if (result.photos) {
                        var photoUrl = result.photos[0].getUrl({ 'maxWidth': 368, 'maxHeight': 256 });
                        document.getElementById("photoUrl").setAttribute("value", photoUrl);
                    }
                    else console.log("no photo");
                }
                else console.log("no place");
            });

            //построение маршрутов для всех дней-областей    
            for (i in model)
            {
                createRoutes(model[i]);
                    
            }
        }
    });
}

function createRoutes(nodes){
    var waypts = [];

    var start = document.getElementById("startPlace").value;
    var end = document.getElementById("endPlace").value;

    for (var j = 0, node; node = nodes[j], j < nodes.length; j++) {
        var inter = new google.maps.LatLng(node.Lat, node.Lng);
        waypts.push({
            location: inter,
            stopover: true
        });
    }

    //запрос к службе directionsService на построение маршрута
    directionsService.route(
        {
            origin: start,
            destination: end,
            waypoints: waypts,
            optimizeWaypoints: true,
            travelMode: google.maps.TravelMode.WALKING
        },
        function (response, status) {
            if (status === google.maps.DirectionsStatus.OK) {

                var dayRoute = formDayRoute(nodes, response.routes[0].waypoint_order)
                trip.push(dayRoute);
                showRoute(response, dayRoute, trip.length);

                map.setCenter(response.routes[0].legs[0].start_location);
                console.log($("#authorize").val());

                if ($("#authorize").val() == "True") {
                    document.getElementById("saveRouteBtn").disabled = false;
                }
            }
            else {
                var errorMessage = "<div><p>Не удалось построить маршрут: ";
                if (status === google.maps.DirectionsStatus.NOT_FOUND) {
                    errorMessage = errorMessage.concat("не найден геокод начальной или конечной точки маршрута.</p></div>");
                }
                if (status === google.maps.DirectionsStatus.ZERO_RESULTS) {
                    errorMessage = errorMessage.concat("не удалось проложить маршрут между исходной точкой и точкой назначения.</p></div>");
                }
                if (status === google.maps.DirectionsStatus.INVALID_REQUEST) {
                    errorMessage = errorMessage.concat("недопустимый запрос</p></div>");
                }
                if (status === google.maps.DirectionsStatus.UNKNOWN_ERROR) {
                    errorMessage = errorMessage.concat("запрос маршрутов не удалось обработать из-за ошибки сервера. Если повторить попытку, запрос может оказаться успешным.</p></div>");
                }

                $(errorMessage)
                .addClass("dialog")
                .appendTo("body")
                .dialog({
                    title: "Ошибка",
                    close: function () { $(this).remove() },
                    modal: true,
                    width: 500,
                    closeText: "X"
                })
                .load(this.href);
            }
        });
}

//формируем маршрут дня
function formDayRoute(nodes, order) {
    var dayRoute = [];

    for (var i = 0; i < order.length; i++) {
        dayRoute.push(nodes[order[i]]);
    }

    return dayRoute;
}

//отправка путешествия на сервер для сохранения
function sendTrip() {
    console.log("here ready to send");

    var addressStart = document.getElementById("startPlace").value;
    var addressEnd = document.getElementById("startPlace").value;
    
    geocoder.geocode({ 'address': addressStart }, function (results, status) {
        if (status === google.maps.GeocoderStatus.OK) {

            var latlng = results[0].geometry.location.toString();
            latlng = latlng.slice(1, latlng.length - 1);
            var coordinates = latlng.split(',');
            coordinates[1] = coordinates[1].slice(1);

            var startPoint = {
                'Lat': coordinates[0],
                'Lng': coordinates[1],
                'PlaceId': null,
                'Address': results[0].formatted_address
            }

            if (addressStart != addressEnd) {
                geocoder.geocode({ 'address': addressEnd }, function (results, status) {
                    if (status === google.maps.GeocoderStatus.OK) {

                        var latlng = results[0].geometry.location.toString();
                        latlng = latlng.slice(1, latlng.length - 1);
                        var coordinates = latlng.split(',');
                        coordinates[1] = coordinates[1].slice(1);

                        var endPoint = {
                            'Lat': coordinates[0],
                            'Lng': coordinates[1],
                            'PlaceId': null,
                            'Address': results[0].formatted_address
                        }

                        sendTripRequest(startPoint, endPoint);
                    }
                    else {
                        $("<div><p>Не удалось определить конечную точку маршрута.</p></div>")
                        .addClass("dialog")
                        .appendTo("body")
                        .dialog({
                            title: "Предупреждение",
                            close: function () { $(this).remove() },
                            modal: true,
                            width: 500,
                            closeText: "X"
                        })
                        .load(this.href);
                    }
                });
            }
            else {
                sendTripRequest(startPoint, startPoint);
            }
        }
        else {
            $("<div><p>Не удалось определить начальную точку маршрута</p></div>")
            .addClass("dialog")
            .appendTo("body")
            .dialog({
                title: "Предупреждение",
                close: function () { $(this).remove() },
                modal: true,
                width: 500,
                closeText: "X"
            })
            .load(this.href);
        }
    });
    
}

function sendTripRequest(startPoint, endPoint) {

    var url = document.getElementById("urlCreateRoute").value;
    var name = document.getElementById("address").value;
    var photoUrl = document.getElementById("photoUrl").value;
    var duration = document.getElementById("duration").value;

    $.ajax({
        type: 'POST',
        url: url,
        data: JSON.stringify({
            'Name': name,
            'Duration': duration,
            'PhotoUrl': photoUrl,
            'Routes': trip,
            'StartPoint': startPoint,
            'EndPoint': endPoint
        }),
        contentType: "application/json",
        success: function (data) {

            var url = document.getElementById("toDetailsUrl").value;
            window.location.href = url + "/" + encodeURIComponent(data);
        },
        error: function (data) {
            //alert("Не удалось сохранить маршрут");

            $("<div><p>Не удалось сохранить маршрут.</p></div>")
            .addClass("dialog")
            .appendTo("body")
            .dialog({
                title: "Предупреждение",
                close: function () { $(this).remove() },
                modal: true,
                width: 500,
                closeText: "X"
            })
            .load(this.href);
        }
    });
}

function deleteRouteMarkersAndLines() {

    for (var i = 0; i < shownRouteMarkers.length; i++) {
        shownRouteMarkers[i].setMap(null);
    }
    shownRouteMarkers = [];

    for (var i = 0; i < shownLines.length; i++) {
        shownLines[i].setMap(null);
    }
    shownLines = [];
}