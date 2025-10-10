$(document).ready(function () {

  //See 'User Permissions' in the documentation above for an explanation of this.
  $('.network-user-name input').val($('.lf-user-name input').val().toUpperCase().substr($('.lf-user-name input').val().lastIndexOf('\\') + 1)).change();




  //When the user clicks the submit button, we want to set the 'closeme' field to 1 so that when the form submits and comes 
  //back to the same page, it will know to call the parent page to close the dialog.
  $('.Submit').click(function (e) {
    e.preventDefault();
    $('.closeme input').val(1);
    $(this.form).submit();
  });

  //This code runs when the form is reloaded after being submitted. If the closeme value is set to 1, it tells the parent page to close the dialog.
  //See 'Dialog Looping Mechanism' in the documentation above for an explanation of this.
  if ($('.closeme input').val() == 1) {
    window.parent.postMessage('CloseDialog', '*');
  }


/**
* onloadlookupfinished Event Handler
* Checks user permissions and disables form elements if the user lacks the necessary rights to add notes.
*/
  $(document).on('lookupcomplete', function (e) {

    //If the user is not an admin user, disable the submit button.
    if (!isAdminUser()) {
      $('.note-text textarea').prop('disabled', true);
      $('.Submit').prop('disabled', true);
      if ($('.error').length == 0) {
        $('#q11').append('<p class="error"><b><font size="4">You do not have permission to add notes to Purchase Orders.</font></b></p>');
      }
    }

    //If there is no purchase order ID, disable the submit button.
    if (($('.poid input').val() == null) || ($('.poid input').val().length == 0)) {
      $('.note-text textarea').prop('disabled', true);
      $('.Submit').prop('disabled', true);
    }

  });

});

/**
* @returns {boolean} True when the current user is an admin user.
*/
function isAdminUser() {
  if ($('.user-isadmin input').val() == '0') {
    return false;
  }
  return true;
}