var departmentMap = new Map();
var departmentNameMap = new Map();

$(document).ready(function () {
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.min.js');
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js');
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');
  var bootstrapButton = $.fn.button.noConflict(); // return $.fn.button to previously assigned value
  $.fn.bootstrapBtn = bootstrapButton;


  $('.Submit').click(function (e) { validateForm(e); });
  $('.Submit').hide();

  $(document).prop('title', 'Machine Group Maintenance');

  wireUpChangeEvents();


  $(document).on("onloadlookupfinished", function () {
    generateAddButton();
    generateGoBackButtons();
    generateEditButtons();
    $('.machinegroup-table').show();
  });


  $(document).on('lookupcomplete', function (e) {
    loadDepartmentMap();
    changeNumericToYesNo('Field36');
    $('.machinegroup-table').show();
  });

});


function callAddMachineGroup() {

  $("#Field9-1").prop("checked", true).change();
  $(".add-machinegroup-id input").val(1).change();
  $('.Submit').show();

}


function callEditMachineGroup(machinegroup_id) {
  $("#Field9-0").prop("checked", true).change();
  $(".edit-machinegroup-id input").val(machinegroup_id).change();
  $('.Submit').show();
}


function changeNumericToYesNo(selector) {

  var isactive = $(`[id^='${selector}']`);
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
      $(this).replaceWith("<input class='return' style='visibilty:visible' type='button' value='Add Machine Group' onclick='callAddMachineGroup()' />");
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
      $(this).parent().append("<input class='table-button' type='button' value='Edit' onclick='callEditMachineGroup(" + btn_value + ")' />");
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
  $(".edit-machinegroup-id input").val("").change();
  $(".add-machinegroup-id input").val("").change();
  $('.Submit').hide();
}


function loadDepartmentMap() {
  if (departmentMap.keys.length == 0) {
    var department_rows = $('.department-lookup-table table tbody tr');
    if (department_rows.length == 0) {
      return;
    }
    department_rows.each(function (index) {
      departmentID = Number($(this).find('.department-lookup-table-id input').val());
      departmentName = $(this).find('.department-lookup-table-name input').val();
      departmentMap.set(departmentID, departmentName);
      departmentNameMap.set(departmentName, departmentID);
    });
  }
}



function wireUpChangeEvents() {
  $('.edit-isactive-value input').change(function () {
    $('.edit-isactive-combo select').val(Number($('.edit-isactive-value input').val()));
  });
  $('.edit-isactive-combo select').change(function () {
    $('.edit-isactive-value input').val(Number($('.edit-isactive-combo select').val()));
  });
  $('.edit-department-combo select').change(function () {
    let departmentID = departmentNameMap.get($('.edit-department-combo select').val());
    $('.edit-department-id input').val(departmentID);
  });
  $('.edit-department-id input').change(function () {
    let departmentName = departmentMap.get(Number($('.edit-department-id input').val()));
    $('.edit-department-combo select').val(departmentName);
  });
  $('.add-department-combo select').change(function () {
    let departmentID = departmentNameMap.get($('.add-department-combo select').val());
    $('.add-department-id input').val(departmentID);
  });
  $('.add-department-id input').change(function () {
    let departmentName = departmentMap.get(Number($('.add-department-id input').val()));
    $('.add-department-combo select').val(departmentName);
  });
  $('.edit-weekday-value input').change(function () {
    $('.edit-weekday-combo select').val(Number($('.edit-weekday-value input').val()));
  });
  $('.edit-weekday-combo select').change(function () {
    $('.edit-weekday-value input').val(Number($('.edit-weekday-combo select').val()));
  });
  $('.add-weekday-value input').change(function () {
    $('.add-weekday-combo select').val(Number($('.add-weekday-value input').val()));
  });
  $('.add-weekday-combo select').change(function () {
    $('.add-weekday-value input').val(Number($('.add-weekday-combo select').val()));
  });
}