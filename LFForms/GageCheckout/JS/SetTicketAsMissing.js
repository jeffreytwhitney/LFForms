$(function () {
  const closeme = String($('.closeme input').val() || '').trim();
  const shouldClose = Number(closeme) === 1;

  $(document).on("onloadlookupfinished", function () {
    console.log('onloadlookupfinished');
  });

  $(document).on('lookupcomplete', function () {
    if (shouldClose) {
      console.log('calling mom...')
      window.parent.postMessage('RefreshAfterMissing', '*');
      return;
    }

    const cell_lead_list = String($('.cell-lead-email-list input').val() || '').trim();

    if (cell_lead_list.length === 0){
      loadCellLeadEmailList();
    }

    if (isFormReadyToSubmit()) {
      submitForm();
    }

  });

});


function isFormReadyToSubmit() {
  const employee_number = String($('.employee-number input').val() || '').trim();
  const ticket_id = Number($('.tid input').val());
  const department_id = Number($('.did input').val());
  const celllead_email_list = String($('.cell-lead-email-list input').val() || '').trim();

  if (ticket_id === 0 || isNaN(ticket_id)) {
    return false;
  }

  if (employee_number.length === 0){
    return false;
  }

  if (celllead_email_list.length === 0){
    return false;
  }

  return !(department_id === 0 || isNaN(department_id));

}


function loadCellLeadEmailList() {
  const cell_lead_emails = $('.cell-lead-email input[type="text"]');
  let email_list = '';

  cell_lead_emails.each(function () {
    const celllead_email = $(this).val();
    if (celllead_email.length > 0) {
      email_list += celllead_email + ';';
    }

  });
  $('.cell-lead-email-list input').val(email_list);
}


function submitForm() {
  const submitButton = $("[name='Submit'], .Submit").first();
  if (submitButton.length > 0) {
    $('.closeme input').val(1)
    submitButton.trigger('click');
  }

}
