

function showCheckboxes() {

    if ($(":checkbox").css("display") == "none") {
        $(":checkbox").css({ display: "block" });
        $(".editTrip").css({ display: "inline" });

        //$(":checkbox").each(function () {
        //    $(this).change(function () {
        //        if ($(this).prop("checked") == true) {

        //        }
        //        else {

        //        }
        //    });
        //});
    }
    else {
        if ($(":checkbox").css("display") == "block") {
            $(":checkbox").css({ display: "none" });
            $(".editTrip").css({ display: "none" });
        }
    }
}

function editTrip(id) {

    var values = [];

    var tripId = decodeURIComponent(location.pathname.split('/')[3]);
    var day = id;
    console.log(day);
    console.log(tripId);

    $(":checkbox:checked").each(function () {
        values.push($(this).val());
    });

    $.ajax({
        type: 'POST',
        url: '/Route/Edit',
        data: JSON.stringify({
            'TripId': tripId,
            'Day': day,
            'Values': values
        }),
        contentType: "application/json",
        success: function (data) {

            //var url = document.getElementById("toDetailsUrl").value;
            //window.location.href = url + "/" + encodeURIComponent(data);
        },
        error: function (data) {
            alert("Не удалось изменить маршрут");
        }
    });
}