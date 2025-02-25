$(document).ready(function () {
  $('.Submit').hide();
  $(document).on("onloadlookupfinished", function () {

    $('.cal-date input').each((i, dateField) => $(dateField).val($(dateField).val().split(" ")[0]));
  });
});