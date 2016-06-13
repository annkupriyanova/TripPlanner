var infowindow, geocoder, map;
var chosenPlaces = [];

$(document).ready(function () {
    var address = decodeURIComponent(location.pathname.split('/')[3]);
    document.getElementById("address").setAttribute("value", address);
});

//инициализация карты (вызывается после загрузки библиотеки)
function initMap() {
    infowindow = new google.maps.InfoWindow();
    geocoder = new google.maps.Geocoder();
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 57, lng: 40.983333 },
        zoom: 8
    });

    var directionsService = new google.maps.DirectionsService;
    var directionsDisplay = new google.maps.DirectionsRenderer;

    directionsDisplay.setMap(map);

    document.getElementById('createRouteBtn').addEventListener('click', function () {
        calculateAndDisplayRoute(directionsService, directionsDisplay);
    });

    //вызов функции поиска мест
    findPlaces();
}

//поиск заданного места и мест поблизости
function findPlaces() {
    address = decodeURIComponent(location.pathname.split('/')[3]);

    geocoder.geocode({ 'address': address }, function (results, status) {
        if (status === google.maps.GeocoderStatus.OK) {
            document.getElementById("addressName").innerHTML = "Добро пожаловать в " + results[0].address_components[0].long_name + "!";
            document.getElementById("address").setAttribute("value", results[0].formatted_address);

            map.setCenter(results[0].geometry.location);
            map.setZoom(14);

            nearbySearch(results[0]);
        }
        else {
            alert("Указанное место не найдено на карте: " + status);
        }
    });
}

// поиск мест поблизости в пределах radius от заданной точки location
function nearbySearch(place) {
    var request = {
        location: place.geometry.location,
        radius: '30000',
        types: ['art_gallery', 'hindu_temple', 'mosque', 'museum', 'park', 'synagogue', 'zoo', 'theatre'],
        rankBy: google.maps.places.RankBy.PROMINENCE
    };

    service = new google.maps.places.PlacesService(map);
    service.nearbySearch(request, processResults);
}

//обработка результатов метода nearbySearch
function processResults(results, status, pagination) {
    if (status !== google.maps.places.PlacesServiceStatus.OK) {
        return;
    }
    else {
        //создаем маркеры на карте
        var bounds = new google.maps.LatLngBounds();        
        for (var i = 0; i < results.length; i++)
        {
            createMarker(results[i]);
            bounds.extend(results[i].geometry.location);

        }
        map.fitBounds(bounds);

        //отправляем на сервер результаты поиска для отображения частичного представления
        var placesToSend = [];
        for (var i = 0; i < results.length; i++) {
            
            placesToSend.push(getPlaceDetails(results[i]));
        }
        sendPlaces(placesToSend);

        //есть ли еще результаты поиска
        var moreButton = document.getElementById('moreBtn');
        if (pagination.hasNextPage) {
            
            moreButton.disabled = false;

            moreButton.addEventListener('click', function () {
                moreButton.disabled = true;
                pagination.nextPage();
            });
        }
        else { moreButton.disabled = true; }
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
        infowindow.setContent(place.name);
        infowindow.open(map, marker);
    });
}

//сборка JSON для отправки результатов поиска на сервер для отображения
function getPlaceDetails(place) {
    var openHours, reviews = [], review, rating, photoUrl, url, website;

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

    if (place.url) {
        url = place.url;
    }
    else
        url = null;

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
        //'Url': url,
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

            var checkboxes = $(".place");
            
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

    //url = document.getElementById("SimilarRoutesUrl");
    //$.ajax({
    //    type: 'GET',
    //    url: url,
    //    dataType: "html",
    //    success: function (data) {
    //        $("#similarRoutes").append(data);
    //    }
    //});
}

//расчет и отображение маршрута
function calculateAndDisplayRoute(directionsService, directionsDisplay) {
    var str, str_arr = [];
    var waypts = [];
    var request;
    var start, end, inter;
    //var checkboxArray = $(':checkbox:checked');

    var checkboxArray = chosenPlaces;
    //console.log(checkboxArray);


    for (var i = 0; i < checkboxArray.length; i++) {
        str_arr = checkboxArray[i].value.split('|');
        str = str_arr[0];
        str = str.substring(1, str.length - 2);
        latlng = str.split(',');
        latlng[1] = latlng[1].substring(1);

        //определение начальной точки маршрута
        if (i == 0) {
            var start = new google.maps.LatLng(latlng[0], latlng[1]);
        }
        //определение конечной точки маршрута
        else if (i == checkboxArray.length - 1) {
            var end = new google.maps.LatLng(latlng[0], latlng[1]);
        }
        //определение промежуточных точек маршрута
        else {
            var inter = new google.maps.LatLng(latlng[0], latlng[1]);
            waypts.push({
                location: inter,
                stopover: true
            });
        }
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

                var idArray = getPath(response.routes[0].waypoint_order);
                ///////////////?????????????
                showRoute(response, idArray);
                ///////////////////////
                //directionsDisplay.setDirections(response);
                map.setCenter(response.routes[0].legs[0].start_location);
                console.log("Success");
                
                document.getElementById("saveRouteBtn").disabled = false;
            }
            else {
                window.alert('Directions request failed due to ' + status);
            }
        });

}

//отрисовка построенного маршрута
function showRoute(response, idArray) {

    var lineCoordinates = [];
    var line;

    //перебор всех ребер маршрута (legs)
    for (var i = 0; i < response.routes[0].legs.length; i++) {

        //добавление маркера в начало ребра
        addMarker(response.routes[0].legs[i].start_location, i + 1, idArray[i]);

        //добавление маркера в конец последнего ребра
        if (i === response.routes[0].legs.length - 1)
        {
            addMarker(response.routes[0].legs[i].end_location, i + 2, idArray[i+1]);
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
        strokeColor: '#4169E0',
        strokeOpacity: 0.8,
        strokeWeight: 5
    });

    line.setMap(map);
}

//добавление маркера в маршрут
function addMarker(location, labelIndex, placeId)
{
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