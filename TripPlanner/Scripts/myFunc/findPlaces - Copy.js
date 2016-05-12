var map;
var infowindow;
var geocoder;
var div;

function initMap() {
    infowindow = new google.maps.InfoWindow();
    geocoder = new google.maps.Geocoder();
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 57, lng: 40.983333 },
        zoom: 8
    });
}

function textSearch() {

    var destination = document.getElementById('address').value;
    var request = {
        location: map.getCenter(),
        radius: '5000',
        query: destination
    };

    var service = new google.maps.places.PlacesService(map);
    service.textSearch(request, callback);
}

//function callback(results, status) {
//    if (status == google.maps.places.PlacesServiceStatus.OK) {
//        var marker = new google.maps.Marker({
//            map: map,
//            place: {
//                placeId: results[0].place_id,
//                location: results[0].geometry.location
//            }
//        });
//        map.setZoom(14);
//        map.setCenter(results[0].geometry.location);
//    }
//}

function findPlaces(){
    var address = decodeURIComponent(location.pathname.split('/')[3]);

    geocoder.geocode({ 'address': address }, function (results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
            document.getElementById("addressName").innerHTML = "Добро пожаловать в " + results[0].address_components[0].short_name + "!";

            map.setCenter(results[0].geometry.location);
            map.setZoom(14);
            
            search(results[0]);
        } else {
            alert("Указанное место не найдено на карте: " + status);
        }
    });
}

function search(place) {
    var request = {
        location: place.geometry.location,
        radius: '5000',
        types: ['amusement_park', 'aquarium', 'art_gallery', 'bar', 'book_store', 'bowling_alley', 'cafe', 'casino', 'church',
            'city_hall', 'hindu_temple', 'library', 'mosque', 'movie_theater', 'museum', 'night_club',
        'park', 'place_of_worship', 'restaurant', 'synagogue', 'zoo']
    };

    service = new google.maps.places.PlacesService(map);
    service.nearbySearch(request, callback);
}

function callback(results, status) {
    if (status == google.maps.places.PlacesServiceStatus.OK) {

        //установка центра карты на координаты первого объекта
        map.setCenter(results[0].geometry.location)

        div = document.getElementById("place_block");
        div.querySelector('h3').innerHTML = results[0].name;
        createMarker(results[0]);
        //создание маркеров для всех объектов
        for (var i = 1, result; result = results[i]; i++) {
            createMarker(result);
            //формирование списка объектов
            createPlaceBlock(result);
        }
    }
    else Console.log("Failure");
}

function createMarker(place) {
    var marker = new google.maps.Marker({
        map: map,
        position: place.geometry.location,
        icon: {
            url: 'http://maps.gstatic.com/mapfiles/circle.png',
            anchor: new google.maps.Point(10, 10),
            scaledSize: new google.maps.Size(10, 17)
        }
    });

    google.maps.event.addListener(marker, 'click', function () {
        infowindow.setContent(place.name);
        infowindow.open(map, this);
    });
    //google.maps.event.addListener(marker, 'click', function () {
    //    service.getDetails(place, function (result, status) {
    //        if (status !== google.maps.places.PlacesServiceStatus.OK) {
    //            console.error(status);
    //            return;
    //        }
    //        infowindow.setContent(result.name);
    //        infowindow.open(map, marker);
    //    });
    //});
}

//function createPlaceBlocks(results) {
//    var div;
//    var div_new;
//    //запрос данных о 1 объекте из списка results
//    service.getDetails(results[0], function (result, status) {
//        if (status == google.maps.places.PlacesServiceStatus.OK) {
//            //div = document.getElementsByClassName('place_block');
//            //div.querySelector("h3").innerHTML = result.name;
//            div = document.createElement('div');
//            div.className = "place_block";
//            div.innerHTML = '<div class="row"><div class="1u"><input type="checkbox" /></div><div class="8u"><h3>' + result.name + '</h3></div><div class="3u"><img src="~/Content/images/pic05.jpg" class="image fit"/></div></div>';
//            document.getElementById('places').appendChild(div);
//        }        
//    });
//    //перебор всех остальных мест
//    for (var i = 1; i < results.length; i++) {
//        service.getDetails(results[i], function (result, status) {
//            if (status == google.maps.places.PlacesServiceStatus.OK) {
//                div_new = div.cloneNode(true);
//                div_new.querySelector('h3').innerHTML = result.name;
//                div.parentNode.insertBefore(div_new, div.nextSibling);
//            }
            
//        });        
//    }  
//}

function createPlaceBlock(result) {
    var div_new;
    //запрос данных о 1 объекте из списка results
    div = document.createElement('div');
    div.className = "place_block";
    div.innerHTML = '<div class="row"><div class="1u"><input type="checkbox" /></div><div class="8u"><h3>' + result.name + '</h3></div><div class="3u"><img src="~/Content/images/pic05.jpg" class="image fit"/></div></div>';
    document.getElementById('places').appendChild(div);
   
    
    //div_new = div.cloneNode(true);
    //div_new.querySelector('h3').innerHTML = result.name;
    //div.parentNode.insertBefore(div_new, div.nextSibling);
    
}