const type_AddNote = 1;
const type_PesterQE = 2;
const type_PesterAssginee = 3;
const type_Completed = 4;
const type_Cancelled = 5;
const type_Waiting = 6;
const refresh_Types = [4, 5, 6];

$(document).ready(function () {

  if (($('.task-id input').val() == null) || ($('.task-id input').val().length == 0)) {
    $('.Submit').addClass("ui-state-disabled");
  }

  $('.date-to-add input').val(moment().format("l"));


  $('.Submit').click(function (e) {
    e.preventDefault();
    $('.closeme input').val(1);
    $(this.form).submit();
  });

  $('.add-time fieldset').change(function () {
    var time_to_add = $('.add-time fieldset input[type="radio"]:checked').val();
    if (time_to_add != 'X') {
      $('.time-to-add input').val(time_to_add);
    }
  });

  $('.amount-of-time input').change(function () {
    $('.time-to-add input').val($('.amount-of-time input').val());
  });


  if ($('.closeme input').val() == 1) {
    
    console.log(window.parent.name);

    if ($('.nt input').val() > 3) {
      window.parent.postMessage('CloseDialogWithRefresh', '*');
    }
    else {
      window.parent.postMessage('CloseDialog', '*');
    }

  }
  $('.network-user-name input').val($('.lf-user-name input').val().toUpperCase().substr($('.lf-user-name input').val().lastIndexOf('\\') + 1)).change();


  $(document).on("onloadlookupfinished", function (e) {
    if (($('.nt input').val() > 1) && ($('.user-type-id input').val() != 1)) {
      $('.Submit').addClass("ui-state-disabled");
      $('.required-note textarea').addClass("ui-state-disabled");
      $('#q3').append('<p class="error"><b><font size="4">You do not have permission to add a note of this kind.</font></b></p>');

    } 

  });



});