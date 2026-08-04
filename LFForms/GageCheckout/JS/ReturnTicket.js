$(function () {
  $(document).on("onloadlookupfinished", function () {

    const ticket_id = $(".tid input").val();
    const ticket_type_id = $(".ttid input").val();
    if ($('.closeme input').val().length === 0) {
      if (ticket_id !== 0 && ticket_type_id !== null) {
        if ($('.closeme input').val().length === 0) {
          $('.closeme input').val(1);
          $("#form1").trigger("submit");
        }
      }
    }
  });

});
