$(document).ready(function () {

  $(document).on('lookupcomplete', function () {
    $('.updated-date-col input').each((i, dateField) => $(dateField).val($(dateField).val().split(" ")[0]));
  });

});
