$(document).ready(function () {
  $(document).on('onloadlookupfinished', function () {

    const site_id = $(".site-id input").val();
    if ($('.closeme input').val().length === 0) {
      if (site_id !== null) {
        window.setTimeout(submitForm, 3000);
        
      }
    }
  });

});


function submitForm() {
  $('.closeme input').val(1);
  $("#form1").trigger("submit");
};
