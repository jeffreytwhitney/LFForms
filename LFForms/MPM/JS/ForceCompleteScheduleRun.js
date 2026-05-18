$(document).ready(function () {

  function getLocalForm() {
    // Resolve the form from this iframe document only.
    return document.getElementById('form1') || document.forms.form1 || document.querySelector('form[name="form1"]');
  }

  function submitLocalForm() {
    let form = getLocalForm();
    if (!form) {
      return;
    }

    // Keep submit button lookup scoped to the iframe form to avoid parent-page collisions.
    let submitButton = form.querySelector('input[type="submit"][name="Submit"], button[type="submit"][name="Submit"], #Submit, input[type="submit"][value="Submit"], button[type="submit"][value="Submit"]');
    if (submitButton && typeof submitButton.click === 'function') {
      submitButton.click();
      return;
    }

    if (typeof form.requestSubmit === 'function') {
      form.requestSubmit();
      return;
    }

    // Bypass masked instance methods (e.g., input named "submit").
    HTMLFormElement.prototype.submit.call(form);
  }


  if ($('.closeme input').val() === '1') {
    window.parent.postMessage('CloseDialog', '*');
  }

  let rid = ($('.rid input').val() || '').toString().trim();
  let enbr = ($('.enbr input').val() || '').toString().trim();

  if (rid.length > 0 && enbr.length > 0) {
    $('.closeme input').val('1');
    $('.Submit').click();
  }

});
