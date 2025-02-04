$(document).ready(function () {
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js');
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
  var bootstrapButton = $.fn.button.noConflict();
  $.fn.bootstrapBtn = bootstrapButton;
  $('.Submit').addClass('ui-button ui-corner-all ui-widget');
  $('.network-user-name input').val($('.lf-user-name input').val().toUpperCase().substr($('.lf-user-name input').val().lastIndexOf('\\') + 1)).change();
  $('.time-entry-date input').val(moment().format("l"));
  

  $(document).on("onloadlookupfinished", function (e) {


  });
  $(document).on('lookupcomplete', function (e) {
    $('.aid input').val($('.user-id input').val());

  });


});