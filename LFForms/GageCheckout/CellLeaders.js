var departmentMap = new Map();
var departmentNameMap = new Map();


$(document).ready(
  function () {
    $('.Submit').hide();
    $(document).prop('title', 'Cell Leader Maintenance');

    $('.edit-cellleader-isactive-value input').change(function () {
      $('.edit-cellleader-isactive-combo select').val(Number($('.edit-cellleader-isactive-value input').val()));
    });

    $('.edit-cellleader-department-id input').change(function () {
      var department_name = departmentMap.get(Number($('.edit-cellleader-department-id input').val()))
      $('.edit-cellleader-department-combo select').val(department_name);
    });



    $(document).on("onloadlookupfinished", function () {

      generateEditButtons();
      generateAddButton();
      generateGoBackButtons();
      changeNumericToYesNo();

      $('.cell-leader-table').css("visibility", "visible");

    });

    $(document).on('lookupcomplete', function (e) {
      loadDepartmentMap();
    });

  });


function changeNumericToYesNo() {

  var isactive = $("[id^='Field26']");
  isactive.each(function (index) {
    var isactive_value = $(this).val();
    if (isactive_value === '1') {
      $(this).val('Yes');
    }
    else {
      $(this).val('No');
    }
  });
}


function callEditCellLeader(user_id) {
  $("#Field8-0").prop("checked", true).change();
  $(".edit-cellleader-id input").val(user_id).change();
  $('.Submit').show();
}


function callAddUser() {

  $("#Field8-1").prop("checked", true).change();
  $(".add-cellleader-id input").val(1).change();
  $('.Submit').show();

}


function checkPermissions() {

  var employee_number = $(".user-employee-number input").val();
  var is_user_active = Number($(".user-isactive input").val());
  var is_user_admin = Number($(".user-isadmin input").val());
  var return_val = true;

  if (is_user_active == 0) {
    return_val = false;
  }

  if (is_user_admin == 0) {
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
      $(this).replaceWith("<input class='return' style='visibilty:visible' type='button' value='Add Cell Leader' onclick='callAddUser()' />");
    }
    else {
      $(this).replaceWith("");
    }
  });

}


function generateEditButtons() {
  var is_admin = checkPermissions();
  var edit_buttons = $(".edit-button input[type=text]");
  edit_buttons.each(function (index) {
    var btn_value = $(this).val();
    if (is_admin) {
      $(this).parent().append("<input class='edit' type='button' value='Edit' onclick='callEditCellLeader(" + btn_value + ")' />");
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
  $(".edit-cellleader-id input").val("").change(); //edit
  $(".add-cellleader-id input").val("").change(); //add
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
