$(document).ready(function () {
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js');
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');
  var bootstrapButton = $.fn.button.noConflict();
  $.fn.bootstrapBtn = bootstrapButton;
  $('.Submit').addClass('ui-button ui-corner-all ui-widget');

  $('.Submit').click(function (e) {
    e.preventDefault();
    $('.closeme input').val(1);
    $(this.form).submit();
  });

  $('.add-time-radio fieldset').change(function () {
    var time_to_add = $('.add-time-radio fieldset input[type="radio"]:checked').val();
    if (time_to_add != 'X') {
      $('.time-to-add input').val(time_to_add);
    }
    else {
      $('.time-to-add input').val(null);
    }
  });

  $('.user-defined-hours input').change(function () {
    $('.time-to-add input').val($('.user-defined-hours input').val());
  });


  if ($('.closeme input').val() == 1) {
    window.parent.postMessage('CloseDialogWithRefresh', '*');
  }
  $('.network-user-name input').val($('.lf-user-name input').val().toUpperCase().substr($('.lf-user-name input').val().lastIndexOf('\\') + 1)).change();


  $(document).on("onloadlookupfinished", function (e) {
    

    $('.date-to-add input').val(moment().format("l"));

  });

  $(document).on('lookupcomplete', function (e) {
    if (($('.tid input').val() == null) || ($('.tid input').val().length == 0)) {
      $('.Submit').addClass("ui-state-disabled");
      $('.add-time-radio fieldset').addClass("ui-state-disabled");
    }

  });



});