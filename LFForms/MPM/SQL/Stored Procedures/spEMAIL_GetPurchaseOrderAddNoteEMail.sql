USE [LF_RMS_COMMS_MPM]
GO

/****** Object:  StoredProcedure [spEMAIL_GetPurchaseOrderAddNoteEMail]    Script Date: 10/10/2025 8:03:10 AM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO





CREATE OR ALTER       PROCEDURE spEMAIL_GetPurchaseOrderAddNoteEMail
	@purchase_order_note_id		INT,
	@email_message						VARCHAR(MAX) OUTPUT
	
AS
	
	BEGIN
	/***************************************************************************************************
	Procedure:      spEMAIL_GetPurchaseOrderAddNoteEMail
	Author:					Jeffrey Whitney
									651-319-7982
									jtwhitney@machine.com
	Purpose:        Builds an outbound HTML email message a new purchase order note.
									Performs token replacement on a stored template and returns final HTML.
	Primary Output: @email_message (OUTPUT parameter) and also SELECT of same value.
	Return Code:    0 on error (after RAISERROR). Success returns no explicit code (NULL / previous @@ERROR).

	Parameters:
		@purchase_order_note_id		INT             Required. Must exist in tblPurchaseOrderNotes.
		@email_message						VARCHAR(MAX)		OUTPUT Final composed HTML.

	Template / Property DepENDencies:
		tblEMailMessageTemplate (EventName, EMailMessageTemplate)

	Tables Referenced:
		tblPurchaseOrder, tblPurchaseOrderNotes, tblUser

	Tokens Replaced (must appear in template to have effect):
		[Submittor] [Requester] [PurchaseOrderType] [PurchaseOrderName] [PurchaseOrderNumber]
		[Description] [Vendor] [Quantity] [Note]

	Behavior Notes:
		- Note tokens are populated (bold wrapped) only if there are notes in the notes table.
		- Dates converted mm/dd/yyyy (style 101).

	Error Handling:
		Accumulates validation failures INTo @error_message and RAISERROR (severity 16) if any:
			- Missing/empty template
			- Invalid @purchase_order_id
			- Invalid @user_id
		  Then RETURNS 0 (caller should trap).

	Example Invocation:
		DECLARE @msg VARCHAR(MAX);
		EXEC spEMAIL_GetPurchaseOrderAddNoteEMail
			 @purchase_order_note_id = 123,
			 @email_message = @msg OUTPUT;
		SELECT @msg;

	Change Log:
		2025-10-09  Initial Creation.

***************************************************************************************************/

		SET NOCOUNT ON;
		DECLARE @email_message_template VARCHAR(max) = (SELECT IsNull(EMailMessageTemplate, '') FROM tblEMailMessageTemplate WHERE EventName = 'PURCHASE_ORDER_ADD_NOTE')
		DECLARE @email_note_rows VARCHAR(max) = ''
		DECLARE @email_note_row VARCHAR(max) = ''
		
		DECLARE @error_message VARCHAR(max) = ''
		
		if (len(trim(@email_message_template)) = 0) 
			BEGIN
				SET @error_message = @error_message + 'EMail Message Template is Empty.\r\n\'
			END

		If (@purchase_order_note_id not in (SELECT ID FROM tblPurchaseOrderNotes)) 
			BEGIN
				SET @error_message = @error_message + 'Purchase Order Note ID is invalid or empty.\r\n\'
			END		
	
		if @error_message <> ''
			BEGIN
				RAISERROR(@error_message, 16, 1)
				RETURN 0
			END	

		SET @email_message = @email_message_template 
		DECLARE @purchase_order_type VARCHAR(255)
		DECLARE @purchase_order_status VARCHAR(255)
		DECLARE @purchase_order_number VARCHAR(255)
		DECLARE @purchase_order_type_id INT
		DECLARE @vendor VARCHAR(255)
		DECLARE @description VARCHAR(max)
		DECLARE @gage_idsn VARCHAR(500)
		DECLARE @quantity VARCHAR(10)
		DECLARE @requester_name VARCHAR(255)
		DECLARE @header_line VARCHAR(500)
		DECLARE @short_gage_idsn VARCHAR(50)
		DECLARE @note_create_date VARCHAR(max) = ''
		DECLARE @note_author VARCHAR(255)
		DECLARE @note_text VARCHAR(MAX)
		DECLARE @site_id INT
		

		DECLARE db_cursor CURSOR FOR SELECT SiteID, poNote, PurchaseOrderNumber, PurchaseOrderTypeID, PurchaseOrderType, Vendor, GageIDSN, Description, 
																				STR(Quantity) as Quantity, PurchaseOrderStatus, RequesterName, Author, 
																				CONVERT(VARCHAR, CreatedTimestamp, 101) as DateCreated
																	FROM qryPurchaseOrderNotes WHERE ID = @purchase_order_note_id;
		OPEN db_cursor;
		
		FETCH NEXT FROM db_cursor INTO	@site_id, @note_text, @purchase_order_number, @purchase_order_type_id, @purchase_order_type, @vendor, @gage_idsn, @description, @quantity, 
																		@purchase_order_status, @requester_name, @note_author, @note_create_date

		CLOSE db_cursor;
		DEALLOCATE db_cursor;

		SET @short_gage_idsn = LEFT(@gage_idsn, 30);

		IF LEN(TRIM(@purchase_order_number)) > 0
			BEGIN
				SET @email_message = Replace(@email_message, '[PurchaseTitle]', @purchase_order_number);
			END
		ELSE
			BEGIN
				SET @email_message = Replace(@email_message, '[PurchaseTitle]', @short_gage_idsn);
				SET @purchase_order_number = 'Not Yet Assigned'
			END
		SET @email_message = Replace(@email_message, '[NoteText]', @note_text);
		SET @email_message = Replace(@email_message, '[NoteBy]', @note_author);
		SET @email_message = Replace(@email_message, '[NoteDate]', @note_create_date);
		SET @email_message = Replace(@email_message, '[PurchaseOrderNumber]',@purchase_order_number);
		SET @email_message = Replace(@email_message, '[Requester]', @requester_name)
		SET @email_message = Replace(@email_message, '[PurchaseOrderType]', @purchase_order_type)
		SET @email_message = Replace(@email_message, '[PurchaseOrderStatus]', @purchase_order_status)
		SET @email_message = Replace(@email_message, '[PurchaseOrderName]', @gage_idsn)

		if @purchase_order_type_id = 1
			BEGIN
				SET @email_message = Replace(@email_message, '[Quantity]', Trim(@quantity))
			END
		
		IF @purchase_order_type_id = 2
			BEGIN
				set @email_message = Replace(@email_message, '[Quantity]', 'N/A')
			END

		set @email_message = Replace(@email_message, '[Description]', @description)
		set @email_message = Replace(@email_message, '[Vendor]', @vendor)
		
		IF @site_id = 1
			BEGIN
				set @email_message = Replace(@email_message, '[SITECODE]', 'CR');
			END
		IF @site_id = 2
			BEGIN
				set @email_message = Replace(@email_message, '[SITECODE]', 'ANK');
			END

		SELECT @email_message
		RETURN
	END
GO


