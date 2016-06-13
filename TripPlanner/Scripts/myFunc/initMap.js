var map;
var geocoder;
var infowindow;
var directionsService;
var directionsDisplay;
var model;
var service;
var resultPlaces = [];
var placesToSend = [];
var lineCoordinates = [];
var line;

$(document).ready(function () {
    getModel();

    //$.ajaxSetup({ cache: false });

    //диалоговое окно для удаления маршрута
    $(".viewDialog").on("click", function (e) {
        e.preventDefault();

        $("<div></div>")
            .addClass("dialog")
            .appendTo("body")
            .dialog({
                title: $(this).attr("data-dialog-title"),
                close: function () { $(this).remove() },
                modal: true,
                width: 400,
                closeText: "X"
            })
            .load(this.href);
    });
    $(".close").on("click", function (e) {
        e.preventDefault();
        $(this).closest(".dialog").dialog("close");
    });
});


//инициализация карты
function initMap() {
    infowindow = new google.maps.InfoWindow();
    geocoder = new google.maps.Geocoder();
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 57, lng: 40.983333 },
        zoom: 8
    });

    service = new google.maps.places.PlacesService(map);
    ///////////////////////для маршрута
    directionsService = new google.maps.DirectionsService;
    directionsDisplay = new google.maps.DirectionsRenderer;

    //directionsDisplay.setMap(map);
    directionsDisplay.setPanel(document.getElementById('instructionPanel'));
    //////////////////
}

// полчение маршрута из БД и отображение его на карте
function getModel() {

    var url = document.getElementById("path").value;
    //// Получаем данные
    //$.getJSON(url, function (data) {
    $.ajax({
        url: url,
        method: 'GET',
        contentType: 'json',
        complete: (jqXHR, status) => {

            model = JSON.parse(jqXHR.responseJSON);

            for (var i = 0; i < model.Routes.length; i++) {

                for (var j = 0; j < model.Routes[i].Routes_Nodes.length; j++) {
                    //для начальной и конечной точки
                    if (model.Routes[i].Routes_Nodes[j].IndexNum == 0 || model.Routes[i].Routes_Nodes[j].IndexNum == model.Routes[i].Routes_Nodes.length - 1) {
                        var placeToSend = {
                            'Value': null,
                            'Name': null,
                            'Address': model.Routes[i].Routes_Nodes[j].Node.Address,
                            'OpeningHours': null,
                            'Website': null,
                            'IndexNum': model.Routes[i].Routes_Nodes[j].IndexNum,
                            'DayNum': model.Routes[i].DayNum
                        };
                        placesToSend.push(placeToSend);
                    }
                    else {
                        getDetails(model.Routes[i].Routes_Nodes[j].Node, model.Routes[i].Routes_Nodes[j].IndexNum, model.Routes[i].DayNum);
                    }
                }
            }

            //построение маршрутов для всех дней-областей    
            for (i in model.Routes) {
                getRoute(model.Routes[i]);
            }

        }
    });
}

function getRoute(dayRoute) {
    var waypts = [];
    var start, end, inter;
    //var day = 1;


    //day = dayRoute.DayNum;
    for (var j = 2; j < dayRoute.Routes_Nodes.length; j++) {
        waypts.push({
            location: new google.maps.LatLng(dayRoute.Routes_Nodes[j].Node.Lat, dayRoute.Routes_Nodes[j].Node.Lng),
            stopover: true
        });
    }

    start = dayRoute.Routes_Nodes[0].Node.Address;
    end = dayRoute.Routes_Nodes[1].Node.Address;

    //запрос к службе directionsService на построение маршрута
    directionsService.route(
        {
            origin: start,
            destination: end,
            waypoints: waypts,
            optimizeWaypoints: false,
            travelMode: google.maps.TravelMode.WALKING,
            //unitSystem: google.maps.UnitSystem.METRIC
        },
        function (response, status) {
            if (status === google.maps.DirectionsStatus.OK) {
                directionsDisplay.setDirections(response);

                showRoute(response, dayRoute, start, end);
                map.setCenter(response.routes[0].legs[0].start_location);
                map.setZoom(14);
                console.log("success");
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

//отрисовка построенного маршрута
function showRoute(response, dayRoute, start, end) {

    var colors = ['#4169E0', '#FFA500', '#32CD32', '#FF0000', '#800080', '#191970', '#BA55D3', '#FF69B4', '#FFFF00', '#008B8B'];

    //var dayRouteShort = dayRoute.slice(2);

    if (dayRoute.DayNum == 1) {
        //добавление маркера для начальной точки
        var marker = new google.maps.Marker({
            position: response.routes[0].legs[0].start_location,
            map: map
        });

        google.maps.event.addListener(marker, 'click', function () {
            infowindow.setContent(start);
            infowindow.open(map, marker);
        });

        if (response.routes[0].legs[0].start_location != response.routes[0].legs[response.routes[0].legs.length - 1].end_location) {
            //добавление маркера для конечной точки
            var marker = new google.maps.Marker({
                position: response.routes[0].legs[response.routes[0].legs.length - 1].end_location,
                map: map
            });

            google.maps.event.addListener(marker, 'click', function () {
                infowindow.setContent(end);
                infowindow.open(map, marker);
            });
        }
    }

    //перебор всех ребер маршрута (legs)
    for (var i = 0; i < response.routes[0].legs.length; i++) {

        if (i > 0) {
            //добавление маркера в начало ребра
            addMarker(response.routes[0].legs[i].start_location, i, dayRoute.Routes_Nodes[i + 1].Node.PlaceId);
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
        strokeColor: colors[dayRoute.DayNum - 1],
        strokeOpacity: 0.8,
        strokeWeight: 5
    });

    line.setMap(map);

    //очищаем массив lineCoordinates
    lineCoordinates.splice(0, lineCoordinates.length);
}


//добавление маркера в маршрут
function addMarker(location, labelIndex, placeId) {

    var labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']

    var marker = new google.maps.Marker({
        position: location,
        label: labels[labelIndex - 1],
        map: map
    });
    //marker.setIcon('http://maps.google.com/mapfiles/ms/icons/blue.png');

    //добавляем маркеру событие нажатия
    google.maps.event.addListener(marker, 'click', function () {
        service.getDetails({ 'placeId': placeId }, function (result, status) {
            //если все хорошо, сохраняем данные о месте в resultPlace
            if (status == google.maps.places.PlacesServiceStatus.OK) {
                infowindow.setContent(result.name);
            }
            else infowindow.setContent("Данные не найдены");
            infowindow.open(map, marker);
        });
    });
}


function getDetails(node, indexNum, dayNum) {

    //запрос данных об объекте node
    service.getDetails({ 'placeId': node.PlaceId }, function (result, status) {
        
        if (status == google.maps.places.PlacesServiceStatus.OK) {

            placesToSend.push(getPlaceDetails(result, indexNum, dayNum));

            if (placesToSend.length == model.NumOfNodes + model.Routes.length * 2) {
                sendPlaces(placesToSend);
            }
        }

        else {
            setTimeout(function () {
                getDetails(node, indexNum, dayNum);
            }, 500);
        }
    });
}

//сборка JSON для отправки результатов поиска на сервер для отображения
function getPlaceDetails(place, indexNum, dayNum) {
    var openHours, url, website;

    //сборка JSON
    if (place.opening_hours) {
        openHours = place.opening_hours.weekday_text;
    }
    else
        openHours = null;

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
        'Address': place.formatted_address,
        'OpeningHours': openHours,
        'Website': website,
        'IndexNum': indexNum,
        'DayNum': dayNum
    };

    return placeToSend;
}

//отправка ajax-запроса на сервер с результатами поиска для отображения
function sendPlaces(placesToSend) {
    //url: /Route/Details
    var url = document.getElementById("pathTable").value;

    $.ajax({
        type: 'POST',
        url: url,
        data: JSON.stringify(placesToSend),
        contentType: "application/json",
        dataType: "html",
        success: function (data) {
            $("div#loading").hide();
            $("#detailedRoute").append(data);
        }
    });
}

/////////////////////////////////

//function ProcessForm(idFrom, valueTo) {
//    var start = document.getElementById(idFrom);
//    var arr = valueTo.split('|');
//    arr[0] = arr[0].substring(1, str.length - 2);
//    var coordinates = arr[0].split(',');
//    coordinates[1] = coordinates[1].substring(1);
//    var end = new google.maps.LatLng(coordinates[0], coordinates[1]);
//    //запрос к службе directionsService на построение маршрута
//    directionsService.route(
//        {
//            origin: start,
//            destination: end,
//            travelMode: google.maps.TravelMode.WALKING
//        },
//        function (response, status) {
//            if (status === google.maps.DirectionsStatus.OK) {
//                directionsDisplay.setDirections(response);
//                map.setCenter(response.routes[0].legs[0].start_location);
//            }
//            else {
//                window.alert('Directions request failed due to ' + status);
//            }
//        });
//}
