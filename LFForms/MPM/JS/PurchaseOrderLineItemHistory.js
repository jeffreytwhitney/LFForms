$(document).ready(function () {

  $(document).on('lookupcomplete', function (e) {
    $('.updated-date-col input').each((i, dateField) => $(dateField).val($(dateField).val().split(" ")[0]));
  });

});