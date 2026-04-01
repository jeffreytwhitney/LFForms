
$(document).ready(function () {
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.min.js');
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js');
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');
  const bootstrapButton = $.fn.button.noConflict(); // return $.fn.button to previously assigned value
  $.fn.bootstrapBtn = bootstrapButton;


  $('.Submit').on("click", function (e) { validateForm(e); });
  $('.Submit').hide();

  $(document).prop('title', 'Department Maintenance');

  wireUpChangeEvents();

  
  $(document).on("onloadlookupfinished", function () {
    generateAddButton();
    generateGoBackButtons();
    generateEditButtons();
    $('#q0').append("<div class='hidden-text' id='popUpDiv'></div>");
    $('.department-table').show();
  });


  $(document).on('lookupcomplete', function (e) {

    changeNumericToYesNo('Field19');
    changeNumericToOddEven('Field21');
    changeNumericToOddEven('Field22');
    $('.department-table').show();
  });

});


function callAddDepartment() {

  $("#Field14-1").prop("checked", true).trigger("change");
  $(".add-department-id input").val(1).trigger("change");
  $('.Submit').show();

}


function callEditDepartment(department_id) {
  $("#Field14-0").prop("checked", true).trigger("change");
  $(".edit-department-id input").val(department_id).trigger("change");
  $('.Submit').show();
}


function changeNumericToYesNo(selector) {

  const isactive = $(`[id^='${selector}']`);
  isactive.each(function (index) {
    const isactive_value = $(this).val();
    if ((isactive_value === '1') || (isactive_value === 'Yes')) {
      $(this).val('Yes');
    }
    else {
      $(this).val('No');
    }
  });
}


function changeNumericToOddEven(selector) {

  const isactive = $(`[id^='${selector}']`);
  isactive.each(function (index) {
    const isactive_value = $(this).val();
    if ((isactive_value === '1') || (isactive_value === 'Odd')) {
      $(this).val('Odd');
    }
    else {
      $(this).val('Even');
    }
  });
}


function checkPermissions() {

  const employee_number = $(".user-employee-number input").val();
  const is_user_active = Number($(".user-isactive input").val());
  let return_val = true;

  if (is_user_active === 0) {
    return_val = false;
  }

  if (employee_number === '') {
    return_val = false;
  }

  return return_val;
}


function generateAddButton() {
  const add_buttons = $(".addbutton");
  const is_admin = checkPermissions();

  add_buttons.each(function (index) {
    if (is_admin) {
      $(this).replaceWith("<input class='return' style='visibilty:visible' type='button' value='Add Department' onclick='callAddDepartment()' />");
    }
    else {
      $(this).replaceWith("");
    }
  });

}


function generateEditButtons() {
  const is_admin = checkPermissions();
  $('.table-button').remove();
  const edit_buttons = $(".edit-button input[type=text]");
  edit_buttons.each(function (index) {
    const btn_value = $(this).val();
    if (is_admin) {
      $(this).parent().append("<input class='table-button' type='button' value='Edit' onclick='callEditDepartment(" + btn_value + ")' />");
    }

  });
}


function generateGoBackButtons() {
  const $goback_buttons = $(".gobackbutton");
  $goback_buttons.each(function (index) {
    $(this).replaceWith("<input class='return' type='button' value='Go Back' onclick='goBack()' />");
  });
}


function goBack() {
  $(".edit-department-id input").val("").trigger("change"); 
  $(".add-department-id input").val("").trigger("change"); 
  $('.Submit').hide();
}


function wireUpChangeEvents() {
  $('.edit-isactive-value input').on("change", function () {
    $('.edit-isactive-combo select').val(Number($('.edit-isactive-value input').val()));
  });
  $('.edit-isactive-combo select').on("change", function () {
    $('.edit-isactive-value input').val(Number($('.edit-isactive-combo select').val()));
  });
  $('.edit-calibration-month-value input').on("change", function () {
    $('.edit-calibration-month-combo select').val(Number($('.edit-calibration-month-value input').val()));
  });
  $('.edit-calibration-month-combo select').on("change", function () {
    $('.edit-calibration-month-value input').val(Number($('.edit-calibration-month-combo select').val()));
  });
  $('.add-calibration-month-value input').on("change", function () {
    $('.add-calibration-month-combo select').val(Number($('.add-calibration-month-value input').val()));
  });
  $('.add-calibration-month-combo select').on("change", function () {
    $('.add-calibration-month-value input').val(Number($('.add-calibration-month-combo select').val()));
  });
  $('.edit-calibration-week-value input').on("change", function () {
    $('.edit-calibration-week-combo select').val(Number($('.edit-calibration-week-value input').val()));
  });
  $('.edit-calibration-week-combo select').on("change", function () {
    $('.edit-calibration-week-value input').val(Number($('.edit-calibration-week-combo select').val()));
  });
  $('.add-calibration-week-value input').on("change", function () {
    $('.add-calibration-week-combo select').val(Number($('.add-calibration-week-value input').val()));
  });
  $('.add-calibration-week-combo select').on("change", function () {
    $('.add-calibration-week-value input').val(Number($('.add-calibration-week-combo select').val()));
  });
}