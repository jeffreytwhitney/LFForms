$(function () {
  const closeme = String($('.closeme input').val() || '').trim();
  const shouldClose = Number(closeme) === 1;

  $(document).on("onloadlookupfinished", function () {
    if (shouldClose) {
      return;
    }
    const employee_number = String($('.employee-number input').val() || '').trim();
    const threadMemberID = String($('.tmid input').val() || '').trim();
    const siteID = Number($('.site-id input').val());

    if (employee_number.length > 0 && threadMemberID.length > 0 && siteID > 0) {
      $('.tmid input').val(threadMemberID);
      const form = document.getElementById('form1') || document.querySelector('form[name="form1"]');
      if (form && typeof form.submit === 'function') {
        form.submit();
        return;
      }

      const submitButton = $("[name='Submit'], .Submit").first();
      if (submitButton.length > 0) {
        submitButton.trigger('click');
      }
    }
  });
});
