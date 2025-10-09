USE [LF_RMS_COMMS_MPM]
GO

/****** Object:  StoredProcedure [spPURCHASEORDER_AddNote]    Script Date: 10/9/2025 5:05:12 AM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO





CREATE   PROCEDURE [spPURCHASEORDER_AddNote]
    @PurchaseOrderID INT,
    @NoteText            VARCHAR(max),
		@UpdateUserID				 VARCHAR(10),
    @NewID               INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
			SET @NoteText = TRIM(@NoteText)

		  if LEN(@NoteText) > 0
				BEGIN
					INSERT INTO tblPurchaseOrderNotes (poID, poNote, UpdateUserID)
					VALUES (@PurchaseOrderID, @NoteText, @UpdateUserID)
				END

      SET @NewID = CAST(SCOPE_IDENTITY() AS INT);
      SELECT @NewID AS [ID];

END


GO


