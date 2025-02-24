
$(document).ready(function () {
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.min.js');
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js');
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');
  var bootstrapButton = $.fn.button.noConflict(); // return $.fn.button to previously assigned value
  $.fn.bootstrapBtn = bootstrapButton;


  $('.Submit').click(function (e) { validateForm(e); });
  $('.Submit').hide();

  $(document).prop('title', 'Department Maintenance');

  $('.edit-departmentisactive-value input').change(function () {
    $('.edit-departmentisactive-combo select').val(Number($('.edit-departmentisactive-value input').val()));
  });

  $('.edit-departmentisactive-combo select').change(function () {
    $('.edit-departmentisactive-value input').val(Number($('.edit-departmentisactive-combo select').val()));
  });

  $('.edit-departmenttype-combo select').change(function () {
    $('.edit-departmenttype-id input').val(Number($('.edit-departmenttype-combo select').val()));
  });
  $('.edit-departmenttype-id input').change(function () {
    $('.edit-departmenttype-combo select').val(Number($('.edit-departmenttype-id input').val()));
  });

  $('.existing-ticket-id input').change(function () {
    if ($('.existing-ticket-id input').val().length > 0) {
      $('.edit-departmentisactive-combo select').removeClass("ui-state-disabled").addClass("ui-state-disabled");
    }
    else {
      $('.edit-departmentisactive-combo select').removeClass("ui-state-disabled");
    }
  });

  
  $(document).on("onloadlookupfinished", function () {
    generateAddButton();
    generateGoBackButtons();
    $('#q0').append("<div class='hidden-text' id='popUpDiv'></div>");
    $('.department-table').show();
  });


  $(document).on('lookupcomplete', function (e) {

    changeNumericToYesNo();
    $('.department-table').show();
  });

});


function callAddDepartment() {

  $("#Field14-1").prop("checked", true).change();
  $(".add-department-id input").val(1).change();
  $('.Submit').show();

}


function callEditDepartment(department_id) {
  $("#Field14-0").prop("checked", true).change();
  $(".edit-department-id input").val(department_id).change();
  $('.Submit').show();
}


function changeNumericToYesNo() {

  var isactive = $("[id^='Field16']");
  isactive.each(function (index) {
    var isactive_value = $(this).val();
    if ((isactive_value === '1') || (isactive_value === 'Yes')) {
      $(this).val('Yes');
    }
    else {
      $(this).val('No');
    }
  });
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
      $(this).replaceWith("<input class='return' style='visibilty:visible' type='button' value='Add Thread' onclick='callAddDepartment()' />");
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
      $(this).parent().append("<input class='table-button' type='button' value='Edit' onclick='callEditDepartment(" + btn_value + ")' />");
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
  $(".edit-threadgage-id input").val("").change(); //edit
  $(".add-threadgage-id input").val("").change(); //add
  $('.Submit').hide();
}

