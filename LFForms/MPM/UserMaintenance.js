var departmentMap = new Map();
var departmentNameMap = new Map();
var userTypeMap = new Map();
var userTypeNameMap = new Map();

$(document).ready(function () {
  var lfUserName = $('.lf-user-name input').val();
  $('.network-user-name input').val(lfUserName.toUpperCase().substr(lfUserName.lastIndexOf('\\') + 1)).change();
  $('.Submit').hide();
  $(document).prop('title', 'User Maintenance');
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.min.js');
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js');
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/simplePagination.js/1.6/simplePagination.min.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');
  var bootstrapButton = $.fn.button.noConflict(); // return $.fn.button to previously assigned value
  $.fn.bootstrapBtn = bootstrapButton;


  $('.Submit').click(function (e) { submitForm(e); });
  $(document).on('change', '.edit-user-is-active-id input', function () {
    var isActive = $('.edit-user-is-active-id input').val();
    $(`.edit-user-is-active input[type='radio'][value='${isActive}']`).prop("checked", true);
  });
  $(document).on('change', '.edit-user-is-admin-id input', function () {
    var isAdmin = $('.edit-user-is-admin-id input').val();
    $(`.edit-user-is-admin input[type='radio'][value='${isAdmin}']`).prop("checked", true);
  });
  $(document).on('change', ".edit-user-is-active input[type='radio']", function () {
    var isActive = $(this).val();
    $('.edit-user-is-active-id input').val(isActive);
  });
  $(document).on('change', ".edit-user-is-admin input[type='radio']", function () {
    var isAdmin = $(this).val();
    $('.edit-user-is-admin-id input').val(isAdmin);
  });
  $(document).on('keyup', '.capitalize-me input', function () {
    this.value = this.value.toUpperCase();
  });



  $(document).on('lookupcomplete', function (e) {
    loadUserTypeMap();
    loadDepartmentMap();
    generateTableButtons(".edit-button-col", "ui-icon-pencil", "Edit User", "callEditUser");
    appendPagination();
    generateFilterRow();
    $('.user-table').show();
  });

  $(document).on("onloadlookupfinished", function (e) {

    generateGoBackButtons();
    if ($('.pg input').val() == '999') {
      $('.pg input').val(1).change();
    }
    $('.network-user-name input').trigger("change");
    $('.user-table').show();
  });

});



function appendPagination() {

  var current_page = Number($('.pg input').val());
  if (current_page == 999) { return; }

  var row_count = getTableRowCount();

  if (row_count > 0) {
    $('#user-pagination').remove();
    if ((current_page == 1) && (row_count < 25)) {
      $('.user-table table').parent().append("<div id='user-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev isDisabled'>‹‹</a></li><li><a class='page-link prev isDisabled'>‹</a></li><li><a class='page-link next isDisabled'>›</a></li></ul></div>");
      return;
    }
    if ((current_page == 1) && (row_count == 25)) {
      $('.user-table table').parent().append("<div id='user-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev isDisabled'>‹‹</a></li><li><a class='page-link prev isDisabled'>‹</a></li><li><a class='page-link next' onclick='callNextPage();' href='javascript:void(0);'>›</a></li></ul></div>")
      return;
    }
    if ((current_page > 1) && (row_count == 25)) {
      $('.user-table table').parent().append("<div id='user-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev' onclick='resetPageNumber();' href='javascript:void(0);''>‹‹</a></li><li><a class='page-link prev' onclick='callPrevPage();' href='javascript:void(0);''>‹</a></li><li><a class='page-link next' onclick='callNextPage();' href='javascript:void(0);'>›</a></li></ul></div>")
      return;
    }
    if ((current_page > 1) && (row_count < 25)) {
      $('.user-table table').parent().append("<div id='user-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev' onclick='resetPageNumber();' href='javascript:void(0);''>‹‹</a></li><li><a class='page-link prev' onclick='callPrevPage();' href='javascript:void(0);''>‹</a></li><li><a class='page-link next isDisabled'>›</a></li></ul></div>")
      return;
    }
  }
}


function callAddUser() {
  $(`.action-choice input[type='radio'][value='1']`).prop("checked", true);
  $('.add-user-id input').val(1).change();
  $('.Submit').show();
}


function callEditUser(userID) {
  $(`.action-choice input[type='radio'][value='2']`).prop("checked", true);
  $('.edit-user-id input').val(userID).change();
  $('.Submit').show();
}


function callGoBack() {
  $(".add-user-id input").val(0).change();
  $(".edit-user-id input").val(0).change();
  $('.Submit').hide();
}


function callNextPage() {
  $('.user-table').hide();
  $('.table-button').remove();

  current_page = Number($('.pg input').val());
  $('.pg input').val(current_page + 1).change();
}


function callPrevPage() {
  $('.user-table').hide();
  $('.table-button').remove();

  current_page = Number($('.pg input').val());
  if (current_page == 1) {
    return;
  }
  $('.pg input').val(current_page - 1).change();
}


function filterTable() {
  if ($('#filterRow').length == 0) {
    return;
  }

  if ($("#chkIncludeInActive").is(":checked")) {
    $('.finc-inactive input').val(1);
  }
  else {
    $('.finc-inactive input').val(0);
  }



  var departmentFilterVal = $('#cboFilter_Department').val();
  var userTypeFilterVal = $('#cboFilter_UserType').val();


  if ((departmentFilterVal != null) && (departmentFilterVal.length > 0)) {
    let departmentID = departmentNameMap.get(departmentFilterVal);
    $('.fdid input').val(departmentID);
  }
  else {
    $('.fdid input').val(0);
  }

  if ((userTypeFilterVal != null) && (userTypeFilterVal.length > 0)) {
    let userTypeID = userTypeNameMap.get(userTypeFilterVal);
    $('.futid input').val(userTypeID);
  }
  else {
    $('.futid input').val(0);
  }

  $('.user-table').hide();
  $('.table-button').remove();
  $('.pg input').val(1).change();

}


function generateFilterRow() {

  if ($('#filterRow').length == 0) {
    var add_button = '<div class="ui-button add-button" onclick="callAddUser()"><span title="Add User" class="ui-button-icon ui-icon ui-icon-plusthick"></span>Add User</div><div class="choice include-choice"><input name="chkIncludeInActive" id="chkIncludeInActive" type="checkbox"><label class="form-option-label" for="chkIncludeInActive">Include InActive</label></div>'
    $(add_button).insertBefore('.user-table table');
    var filter_row = "<TR id='filterRow'><TH/><TH/><TH/><TH><select id='cboFilter_UserType'/></TH><TH><select id='cboFilter_Department'/></TH><TH/><TH/><TH/></TR>"
    $('.user-table table thead').append(filter_row);

    $("#cboFilter_UserType").on("change", function () { filterTable(); });
    $("#cboFilter_Department").on("change", function () { filterTable(); });
    $("#chkIncludeInActive").on("change", function () { filterTable(); });

    $("#cboFilter_Department").dblclick(function () { $("#cboFilter_Department").val(0).change(); });
    $("#cboFilter_UserType").dblclick(function () { $("#cboFilter_UserType").val(0).change(); });
    wireUpSortFields();
  }

  if (($(".department-combo select option").length > 1) && ($("#cboFilter_Department option").length == 0)) {
    $("#cboFilter_Department").html($(".department-combo select").html());
  }
  if (($(".user-type-combo select option").length > 1) && ($("#cboFilter_UserType option").length == 0)) {
    $("#cboFilter_UserType").html($(".user-type-combo select").html());
  }
}


function generateGoBackButtons() {
  var $goback_buttons = $(".gobackbutton");
  $goback_buttons.each(function (index) {
    $(this).parent().append("<div id='go-back' class='ui-button ui-corner-all ui-widget' onclick='callGoBack()'><span class='ui-icon ui-icon-arrowreturnthick-1-w'></span>Go Back</div>");
  });
  $(".gobackbutton").remove();
}


function generateTableButtons(buttonSelector, buttonClass, buttonTitle, buttonFunction) {
  var selectionString = buttonSelector + " input[type=text]";
  var buttons = $(selectionString);
  buttons.each(function () {
    var btn_value = $(this).val();
    var btn_html = `<div class='table-button ui-button' onclick='${buttonFunction}(${btn_value})'><span title='${buttonTitle}' class='ui-button-icon ui-icon ${buttonClass}'/></div>`

    var has_button = $(this).parent().find(`.${buttonClass}`).length;
    if (has_button == 0) {
      $(this).parent().append(btn_html);
    }
  });
}


function getTableRowCount() {
  var row_count = $('.user-table tbody tr').length;
  return row_count;
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


function loadUserTypeMap() {
  if (userTypeMap.keys.length == 0) {
    var userType_rows = $('.usertype-lookup-table table tbody tr');
    if (userType_rows.length == 0) {
      return;
    }
    userType_rows.each(function (index) {
      userTypeID = Number($(this).find('.usertype-lookup-table-id input').val());
      userTypeName = $(this).find('.usertype-lookup-table-name input').val();
      userTypeMap.set(userTypeID, userTypeName);
      userTypeNameMap.set(userTypeName, userTypeID);
    });
  }
}


function sortTable(newSortOrdinal, selector) {

  $('.table-button').remove();
  $('.sort-icon').remove();

  var currentSortOrdinal = Number($('.sfo input').val());
  var sortDirection = Number($('.sd input').val());

  if (newSortOrdinal == currentSortOrdinal) {
    if (sortDirection == 0) {
      sortDirection = 1
      $('.sd input').val(1).change();
    }
    else {
      sortDirection = 0;
      $('.sd input').val(0).change();
    }
  }
  else {
    $('.sfo input').val(newSortOrdinal);
    $('.sd input').val(0).change();
    sortDirection = 0;
  }

  if (sortDirection == 0) {
    $(`${selector} .cf-col-label`).append('<span class="ui-icon ui-icon-triangle-1-n sort-icon"></span>');
  }
  else {
    $(`${selector} .cf-col-label`).append('<span class="ui-icon ui-icon-triangle-1-s sort-icon"></span>');
  }
}


function submitForm(e) {
  var actionID = Number($('.action-choice input[type="radio"]:checked').val());
  if (actionID == 1) {
    if (validateAdd() == false) {
      e.preventDefault();
      return;
    }
  }
  if (actionID == 2) {
    if (validateEdit() == false) {
      e.preventDefault();
      return;
    }
  }
  
}


function validateAdd() {
  $('#existing-user-error').remove();
  var addUserCount = $('.add-existing-users select option').length;
  var addNetworkUserNameField = $('.add-user-network-user-name input');
  console.log(`addUserCount: ${addUserCount}`);
  if (addUserCount > 1) {
    addNetworkUserNameField.parent().append("<ul id='existing-user-error' role='alert' class='parsley-errors-list filled'><li class='parsley-required'>There is another ACTIVE user with this network username. Please inactivate the other user first. Then you can add this one.</li></ul>");
    return false;
  }
  else {
    return true;
  }
}

function validateEdit() {
  $('#existing-user-error').remove();
  var returnValue = true;
  var editNetworkUserNameField = $('.edit-user-network-user-name input');
  var editUserID = Number($('.edit-user-id input').val());
  var existingUserIDs = $('.edit-existing-users select option');

  $(existingUserIDs).each(function (index) {
    let existingUserID = Number($(this).val());
    console.log(`existingUserID: ${existingUserID}`);
    console.log(`editUserID: ${editUserID}`);
    if (existingUserID == 0) {
      return;
    }
    if (existingUserID != editUserID) {
      editNetworkUserNameField.parent().append("<ul id='existing-user-error' role='alert' class='parsley-errors-list filled'><li class='parsley-required'>There is another ACTIVE user with this network username. Please inactivate the other user first. Then you can change this one.</li></ul>");

      returnValue == false;
      return;
    }
  });
  return returnValue;
}

function wireUpSortFields() {

  $('#q21 .cf-col-label').append('<span class="ui-icon ui-icon-triangle-1-n sort-icon"></span>');

  $('#q21').on('click', function () { sortTable(0, '#q21'); });
  $('#q22').on('click', function () { sortTable(1, '#q22'); });
  $('#q23').on('click', function () { sortTable(2, '#q23'); });


}