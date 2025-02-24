
$(document).ready(function () {
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.min.js');
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js');
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/simplePagination.js/1.6/simplePagination.min.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');
  var bootstrapButton = $.fn.button.noConflict(); // return $.fn.button to previously assigned value
  $.fn.bootstrapBtn = bootstrapButton;


  $('.Submit').click(function (e) { validateForm(e); });
  $('.Submit').hide();

  $(document).prop('title', 'Site Maintenance');




  $(document).on("onloadlookupfinished", function () {
    generateAddButton();
    generateGoBackButtons();
    generateEditButtons();
    $('.site-table').show();
  });

  $(document).on('lookupcomplete', function (e) {
    
    $('.site-table').show();
  });

});


function callAddSite() {

  $("#Field9-1").prop("checked", true).change();
  $(".add-site-id input").val(1).change();
  $('.Submit').show();

}


function callEditSite(thread_id) {
  $("#Field9-0").prop("checked", true).change();
  $(".edit-site-id input").val(thread_id).change();
  $('.Submit').show();
}


function checkPermissions() {

  var employee_number = $(".user-employee-number input").val();
  var is_user_active = Number($(".user-isactive input").val());
  var return_val = true;

  if (is_user_active == 0) {
    return_val = false;
  }

  if (employee_number === '') {
    return_val = false;
  }

  return return_val;
}


function generateAddButton() {
  var add_buttons = $(".addbutton");
  var is_admin = checkPermissions();

  add_buttons.each(function (index) {
    if (is_admin) {
      $(this).replaceWith("<input class='return' style='visibilty:visible' type='button' value='Add Thread' onclick='callAddSite()' />");
    }
    else {
      $(this).replaceWith("");
    }
  });

}


function generateEditButtons() {
  var is_admin = checkPermissions();
  $('.table-button').remove();
  var edit_buttons = $(".edit-button input[type=text]");
  edit_buttons.each(function (index) {
    var btn_value = $(this).val();
    if (is_admin) {
      $(this).parent().append("<input class='table-button' type='button' value='Edit' onclick='callEditSite(" + btn_value + ")' />");
    }

  });
}


function generateGoBackButtons() {
  var $goback_buttons = $(".gobackbutton");
  $goback_buttons.each(function (index) {
    $(this).replaceWith("<input class='return' type='button' value='Go Back' onclick='goBack()' />");
  });
}


function goBack() {
  $(".edit-site-id input").val("").change(); //edit
  $(".add-site-id input").val("").change(); //add
  $('.Submit').hide();
}


function resetValidationErrors() {
  $('.add-thread-table-new-thread-number input').removeClass('parsley-error');
  $('#preexisting-thread-error').remove();
}


function validateForm(e) {

  var isValid = true;
  resetValidationErrors();

  var existingthreadNameID = $('.existing-thread-name-id input').val();
  console.log(`ExistingthreadID:${existingthreadNameID}`);
  var threadNameField = $('.add-thread-name input');

  if (existingthreadNameID.length > 0) {
    threadNameField.parent().find('#preexisting-thread-error').remove();
    threadNameField.parent().append("<ul id='preexisting-thread-error' role='alert' class='parsley-errors-list filled'><li class='parsley-required'>There is already a thread with this name.</li></ul>");
    threadNameField.addClass('parsley-error');
    isValid = false;
  }
  if (isValid == false) {
    if (arguments.length === 1) {
      e.preventDefault();
    }
  }
  else {
    $('#Field999').remove();
  }

}
