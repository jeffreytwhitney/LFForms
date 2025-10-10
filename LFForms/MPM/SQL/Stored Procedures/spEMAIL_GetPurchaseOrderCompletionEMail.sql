USE [LF_RMS_COMMS_MPM]
GO

/****** Object:  StoredProcedure [spEMAIL_GetPurchaseOrderCompletionEMail]    Script Date: 10/9/2025 11:33:06 AM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO




CREATE OR ALTER     PROCEDURE [spEMAIL_GetPurchaseOrderCompletionEMail]
	@purchase_order_id	INT,
	@user_id						VARCHAR(10),
	@completion_note		VARCHAR(1000),
	@email_message			VARCHAR(MAX) OUTPUT
	
AS
	
	BEGIN
	/***************************************************************************************************
	Procedure:      spEMAIL_GetPurchaseOrderCompletionEMail
	Author:					Jeffrey Whitney
									651-319-7982
									jtwhitney@machine.com
	Purpose:        Builds an outbound HTML email message a new purchase order.
									Performs token replacement on a stored template and returns final HTML.
	Primary Output: @email_message (OUTPUT parameter) and also SELECT of same value.
	Return Code:    0 on error (after RAISERROR). Success returns no explicit code (NULL / previous @@ERROR).

	Parameters:
		@purchase_order_id  INT             Required. Must exist in tblPurchaseOrders.
		@user_id            VARCHAR(10)     Required. EmployeeNumber of acting user (NOT tblUser.ID).
		@completion_note    VARCHAR(1000)		Optional. Completion Note text. 
		@email_message      VARCHAR(MAX)		OUTPUT Final composed HTML.

	Template / Property DepENDencies:
		tblEMailMessageTemplate (EventName, EMailMessageTemplate)

	Tables Referenced:
		tblPurchaseOrder, tblPurchaseOrderNotes, tblUser

	Tokens Replaced (must appear in template to have effect):
		[Submittor] [Requester] [PurchaseOrderType] [PurchaseOrderName] [PurchaseOrderNumber]
		[Description] [Vendor] [Quantity] [TotalCost] [Note]

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
		EXEC spEMAIL_GetPurchaseOrderCompletionEMail
			 @purchase_order_id = 123,
			 @completion_note = 'Purchase Order Is Complete.'
			 @user_id = '1234',
			 @email_message = @msg OUTPUT;
		SELECT @msg;

	Change Log:
		2025-10-09  Initial Creation.

***************************************************************************************************/

		SET NOCOUNT ON;
		DECLARE @email_message_template VARCHAR(max) = (SELECT IsNull(EMailMessageTemplate, '') FROM tblEMailMessageTemplate WHERE EventName = 'PURCHASE_ORDER_COMPLETION')
		DECLARE @email_note_row_template VARCHAR(max) = (SELECT IsNull(EMailMessageTemplate, '') FROM tblEMailMessageTemplate WHERE EventName = 'PURCHASE_ORDER_NOTE_ROW')
		DECLARE @email_note_rows VARCHAR(max) = ''
		DECLARE @email_note_row VARCHAR(max) = ''
		
		DECLARE @error_message VARCHAR(max) = ''
		
		if (len(trim(@email_message_template)) = 0) 
			BEGIN
				SET @error_message = @error_message + 'EMail Message Template is Empty.\r\n\'
			END

	  if (len(trim(@email_note_row_template)) = 0) 
			BEGIN
				SET @error_message = @error_message + 'EMail Note Row Template is Empty.\r\n\'
			END

		If (@purchase_order_id not in (SELECT ID FROM tblPurchaseOrder)) 
			BEGIN
				SET @error_message = @error_message + 'Purchase Order ID is invalid or empty.\r\n\'
			END		

		If (@user_id not in (SELECT EmployeeNumber FROM tblUser WHERE IsActive = 1)) 
			BEGIN
				SET @error_message = @error_message + 'User ID is Empty.\r\n\'
			END
		
		if @error_message <> ''
			BEGIN
				RAISERROR(@error_message, 16, 1)
				RETURN 0
			END	

	  SET @completion_note = Trim(@completion_note)
		SET @email_message = @email_message_template 
		DECLARE @submittor_name VARCHAR(255) = (SELECT FullName FROM tblUser WHERE EmployeeNumber = @user_id AND ISActive = 1)
		DECLARE @purchase_order_type VARCHAR(255)
		DECLARE @purchase_order_status VARCHAR(255)
		DECLARE @purchase_order_number VARCHAR(255)
		DECLARE @purchase_order_type_id INT
		DECLARE @site_id INT
		DECLARE @site_name VARCHAR(255)
		DECLARE @vendor VARCHAR(255)
		DECLARE @description VARCHAR(max)
		DECLARE @gage_idsn VARCHAR(500)
		DECLARE @total_cost VARCHAR(50)
		DECLARE @quantity VARCHAR(10)
		DECLARE @requester_name VARCHAR(255)
		DECLARE @header_line VARCHAR(500)
		DECLARE @short_gage_idsn VARCHAR(50)
		DECLARE @date_created VARCHAR(100)
		DECLARE @last_updated	VARCHAR(100)
		DECLARE @last_updated_by VARCHAR(255)
		DECLARE @note_create_date VARCHAR(max) = ''
		DECLARE @note_author VARCHAR(255)
		DECLARE @note_text VARCHAR(max)
		DECLARE @note_count INT = (SELECT Count(*) from tblPurchaseOrderNotes where poID = @purchase_order_id)

		DECLARE db_cursor CURSOR FOR SELECT SiteID, PurchaseOrderNumber, PurchaseOrderTypeID, PurchaseOrderType, Vendor, GageIDSN, Format(TotalCost, 'C') as TotalCost, Description, 
																				STR(Quantity) as Quantity, PurchaseOrderStatus, RequesterName, UpdatedBy, 
																				CONVERT(VARCHAR, DateCreated, 101) as DateCreated, CONVERT(VARCHAR, LastUpdated, 101) as LastUpdated
																	FROM qryPurchaseOrderList WHERE ID = @purchase_order_id;
		OPEN db_cursor;
		
		FETCH NEXT FROM db_cursor INTO	@site_id, @purchase_order_number, @purchase_order_type_id, @purchase_order_type, @vendor, @gage_idsn, @total_cost, @description, @quantity, 
																		@purchase_order_status, @requester_name, @last_updated_by, @date_created, @last_updated

		CLOSE db_cursor;
		DEALLOCATE db_cursor;

		SET @short_gage_idsn = LEFT(@gage_idsn, 30);

		IF LEN(TRIM(@purchase_order_number)) > 0
			BEGIN
				SET @header_line = 'Purchase Order ' + @purchase_order_number + ' (''' + @short_gage_idsn + ''') has been completed.'
			END
		
		set @email_message = Replace(@email_message, '[HeaderLine]',@header_line);

		IF LEN(@completion_note) > 0
			BEGIN
				DECLARE @completion_note_html VARCHAR(MAX) = '<h3>Completion Note:</h3><div>' + @completion_note + '</div>'
				set @email_message = Replace(@email_message, '[CompletionNote]', @completion_note_html);
			END
		ELSE
			BEGIN
				set @email_message = Replace(@email_message, '[CompletionNote]', '');
			END
		
		set @email_message = Replace(@email_message, '[PurchaseOrderNumber]',@purchase_order_number);
		set @email_message = Replace(@email_message, '[Submittor]',@submittor_name);
		set @email_message = Replace(@email_message, '[Requester]', @requester_name)
		set @email_message = Replace(@email_message, '[PurchaseOrderType]', @purchase_order_type)
		set @email_message = Replace(@email_message, '[PurchaseOrderName]', @gage_idsn)

		if @purchase_order_type_id = 1
			BEGIN
				set @email_message = Replace(@email_message, '[Quantity]', Trim(@quantity))
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

		IF @note_count > 0
			BEGIN
				DECLARE note_cursor CURSOR FOR SELECT Author, CONVERT(varchar, CreatedTimestamp, 101) As CreateDate, poNote 
																			FROM qryPurchaseOrderNotes where poID = @purchase_order_id
																			ORDER BY ID DESC;
				OPEN note_cursor;
				FETCH NEXT FROM note_cursor INTO @note_author, @note_create_date, @note_text;

				WHILE @@FETCH_STATUS = 0  
						BEGIN  
							SET @email_note_row = @email_note_row_template;
							SET @email_note_row = Replace(@email_note_row, '[CreateDateTime]', @note_create_date);
							SET @email_note_row = Replace(@email_note_row, '[Author]', @note_author);
							SET @email_note_row = Replace(@email_note_row, '[NoteText]', @note_text);

							SET @email_note_rows = CONCAT(@email_note_rows, @email_note_row)
							
							FETCH NEXT FROM note_cursor INTO @note_author, @note_create_date, @note_text;
						END;

				CLOSE note_cursor;
				DEALLOCATE note_cursor;
			END

		SET @email_message = Replace(@email_message, '[NoteRows]', @email_note_rows);


		IF LEN(@completion_note) > 0
			BEGIN
				DECLARE @completion_note_text VARCHAR(Max) = 'COMPLETION NOTE: ' + @completion_note
				INSERT INTO tblPurchaseOrderNotes (poID, poNote, UpdateUserID) Values (@purchase_order_id, @completion_note_text, @user_id)
			END

		SELECT @email_message
		RETURN
	END
GO


