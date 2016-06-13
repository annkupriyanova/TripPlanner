function ShowHidePlaceDetails(value) {   

    if (value.style.display == "none")
    {
        if (value.innerHTML == "")
        {
            var placeId = value.id;

            var service = new google.maps.places.PlacesService(map);
            service.getDetails({ 'placeId': placeId }, function (result, status) {
                //если все хорошо
                if (status == google.maps.places.PlacesServiceStatus.OK) {

                    var p = document.createElement('p');
                    if (result.website != null && result.website != "")
                    {
                        var website = document.createElement('a');
                        website.setAttribute("href", result.website);
                        website.innerText = result.website;
                        p.appendChild(website);
                    }
                    else
                    {
                        p.innerText = "Данные отсутствуют";
                    }                    
                    value.appendChild(p);

                    value.style.display = "block";
                }
            });
        }
        else
        {
            value.style.display = "block";
        }        
    }
    else
    {
        if (value.style.display == "block")
        {
            value.style.display = "none";
        }
    }   
}