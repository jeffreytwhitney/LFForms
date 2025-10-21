USE [LF_RMS_COMMS_MPM]
GO

/****** Object:  StoredProcedure spEMAIL_GetPurchaseOrderUpdateMail    Script Date: 10/20/2025 1:25:25 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE OR ALTER         PROCEDURE spEMAIL_GetPurchaseOrderUpdateMail
	@purchase_order_id		INT,
	@completion_note_id		INT,
	@email_template_name	varchar(255),
	@email_message				VARCHAR(MAX) OUTPUT
	
AS
	
	BEGIN
	/***************************************************************************************************
	Procedure:      spEMAIL_GetPurchaseOrderUpdateMail
	Author:					Jeffrey Whitney
									651-319-7982
									jtwhitney@machine.com
	Purpose:        Builds an outbound HTML email message a new purchase order.
									Performs token replacement on a stored template and returns final HTML.
	Primary Output: @email_message (OUTPUT parameter) and also SELECT of same value.
	Return Code:    0 on error (after RAISERROR). Success returns no explicit code (NULL / previous @@ERROR).

	Parameters:
		@purchase_order_id		INT             Required. Must exist in tblPurchaseOrders.
		@completion_note_id		INT							Optional. ID of Completion/Cancellation Note. 
		@email_template_name  VARCHAR(255)		Required. The name of the template to use.
		@email_message				VARCHAR(MAX)		OUTPUT Final composed HTML.

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
		EXEC spEMAIL_GetPurchaseOrderUpdateMail
			 @purchase_order_id = 123,
			 @completion_note_id = 321,
			 @email_template_name = 'PURCHASE_ORDER_COMPLETION'
			 @email_message = @msg OUTPUT;
		SELECT @msg;

	Change Log:
		2025-10-09  Initial Creation.

***************************************************************************************************/

		SET NOCOUNT ON;
		DECLARE @email_message_template VARCHAR(max) = (SELECT IsNull(EMailMessageTemplate, '') FROM tblEMailMessageTemplate WHERE EventName = @email_template_name)
		DECLARE @email_row_template VARCHAR(max) = (SELECT IsNull(EMailMessageTemplate, '') FROM tblEMailMessageTemplate WHERE EventName = 'PURCHASE_ORDER_UPDATE_ROW')
		DECLARE @lineitem_rows VARCHAR(max) = ''
		DECLARE @lineitem_row VARCHAR(max) = ''
		
		DECLARE @error_message VARCHAR(max) = ''
		
		if (len(trim(@email_message_template)) = 0) 
			BEGIN
				SET @error_message = @error_message + 'EMail Message Template is Empty.\r\n\'
			END

	  if (len(trim(@email_row_template)) = 0) 
			BEGIN
				SET @error_message = @error_message + 'EMail Row Template is Empty.\r\n\'
			END

		If (@purchase_order_id not in (SELECT ID FROM tblPurchaseOrder)) 
			BEGIN
				SET @error_message = @error_message + 'Purchase Order ID is invalid or empty.\r\n\'
			END		
		
		if @error_message <> ''
			BEGIN
				RAISERROR(@error_message, 16, 1)
				RETURN 0
			END	

		SET @email_message = @email_message_template 
		
		
		/*Purchase Order Variables*/
		SET @completion_note_id = ISNULL(@completion_note_id, 0)
		DECLARE @header_line varchar(500)
		DECLARE @site_id INT
		DECLARE @site_name varchar(255)
		DECLARE @date_created varchar(100)
		DECLARE @requester_name VARCHAR(255)
		DECLARE @purchase_order_type VARCHAR(255)
		DECLARE @purchase_order_status VARCHAR(255)
		DECLARE @purchase_order_number VARCHAR(255)
		DECLARE @purchase_order_type_id INT
		DECLARE @vendor VARCHAR(255)
		DECLARE @purchase_order_status_id INT
		DECLARE @description VARCHAR(max)
		DECLARE @short_description as VARCHAR(500)
		DECLARE @last_updated	varchar(100)
		DECLARE @last_updated_by varchar(255)
		DECLARE @completion_note varchar(max) = ''
		DECLARE @completion_note_html VARCHAR(MAX) = ''
		DECLARE @header_line_title varchar(500)

		/*Line Item Variables*/
		DECLARE @li_quantity VARCHAR(10)
		DECLARE @li_type_id INT
		DECLARE @li_row_id INT
		DECLARE @li_gage_idsn VARCHAR(500)
		DECLARE @li_type_name varchar(255)
		DECLARE @li_status_name varchar(255)
		DECLARE @li_last_updated	varchar(15)
		DECLARE @li_last_updated_by varchar(255)
		DECLARE @li_service_date varchar(15)
		DECLARE @li_date_created varchar(15)
		
		


		DECLARE po_cursor CURSOR FOR	SELECT SiteID, PurchaseOrderNumber, SiteName, Vendor, Description, PurchaseOrderStatusID, PurchaseOrderStatus, RequesterName, UpdatedBy,
																	CONVERT(varchar, DateCreated, 101) as DateCreated, CONVERT(varchar, LastUpdated, 101) as LastUpdated
																	FROM qryPurchaseOrderList where ID = @purchase_order_id;
		OPEN po_cursor;
		
		FETCH NEXT FROM po_cursor INTO	@site_id, @purchase_order_number, @site_name, @vendor, @description, @purchase_order_status_id, @purchase_order_status, @requester_name, @last_updated_by, @date_created, @last_updated

		CLOSE po_cursor;
		DEALLOCATE po_cursor;

		SET @description = REPLACE(@description, '''', '')
		SET @short_description = ' (''' + LEFT(@description, 50) + ''') '

		IF LEN(TRIM(@purchase_order_number)) > 0
			BEGIN
				SET @header_line_title = @purchase_order_number +  @short_description 
			END
		ELSE
			BEGIN
				SET @header_line_title = ' ''' + LEFT(@description, 50) + ''' '
			END

		SET @header_line = CASE 
			WHEN @purchase_order_status_id = 3 THEN 'Purchase Order ' + @header_line_title + ' has been completed.'
			WHEN @purchase_order_status_id = 4 THEN 'Purchase Order ' + @header_line_title + ' has been cancelled.'
			ELSE 'Update to Purchase Order ' + @header_line_title
		END

		IF @completion_note_id > 0
			BEGIN
				SET @completion_note = (Select poNote from tblPurchaseOrderNotes where id = @completion_note_id)
				Print @completion_note
				IF @purchase_order_status_id = 3
					BEGIN
						SET @completion_note_html = '<h4>Completion Note:</h4><blockquote>''' + @completion_note + '''</blockquote>'
					END
				
				IF @purchase_order_status_id = 4
					BEGIN
						SET @completion_note_html = '<h4>Cancellation Reason:</h4><blockquote>''' + @completion_note + '''</blockquote>'
					END
			END
		ELSE
			BEGIN
				SET @completion_note_html = ''
			END

		IF @purchase_order_number = ''
			BEGIN
				SET @purchase_order_number = 'Not Yet Assigned'
			END



		set @email_message = Replace(@email_message, '[HeaderLine]',@header_line);
		set @email_message = Replace(@email_message, '[SiteName]', @site_name)
		set @email_message = Replace(@email_message, '[PurchaseOrderNumber]', @purchase_order_number)
		set @email_message = Replace(@email_message, '[CompletionNote]', @completion_note_html);
		set @email_message = Replace(@email_message, '[Description]', @description)
		set @email_message = Replace(@email_message, '[Requester]', @requester_name)
		set @email_message = Replace(@email_message, '[PurchaseOrderStatus]', @purchase_order_status)
		set @email_message = Replace(@email_message, '[Vendor]', @vendor)
		set @email_message = Replace(@email_message, '[DateCreated]', @date_created)
		set @email_message = Replace(@email_message, '[LastUpdated]', @last_updated)
		set @email_message = Replace(@email_message, '[LastUpdatedBy]', @last_updated_by)

	DECLARE li_cursor CURSOR FOR	SELECT ID, PurchaseOrderType, LineItemTypeID, GageIDSN, Status, CAST(Quantity as varchar) as Quantity, CONVERT(varchar, ServiceDate, 101) as ServiceDate,
																	CONVERT(varchar, DateCreated, 101) as DateCreated, CONVERT(varchar, DateUpdated, 101) as DateUpdated, FullName
																	FROM qryPurchaseOrderLineItems where PurchaseOrderID = @purchase_order_id ORDER BY ID DESC;
		OPEN li_cursor;
		
		FETCH NEXT FROM li_cursor INTO @li_row_id, @li_type_name, @li_type_id, @li_gage_idsn, @li_status_name, @li_quantity, @li_service_date, @li_date_created, @li_last_updated, @li_last_updated_by
		
		WHILE @@FETCH_STATUS = 0  
				BEGIN  
					SET @lineitem_row = @email_row_template;
					
					/*Field Manipulation Logic*/
					SET @li_status_name = ISNULL(@li_status_name, '');
					SET @li_service_date = ISNULL(@li_service_date, '');

					IF @li_type_id = 2
						BEGIN
							SET @li_quantity = ''
						END

					SET @lineitem_row = Replace(@lineitem_row, '[GageIDSN]', TRIM(@li_gage_idsn))
					SET @lineitem_row = Replace(@lineitem_row, '[LineItemStatus]', @li_status_name);
					SET @lineitem_row = Replace(@lineitem_row, '[LineItemType]', @li_type_name);
					SET @lineitem_row = Replace(@lineitem_row, '[Quantity]', @li_quantity);
					SET @lineitem_row = Replace(@lineitem_row, '[ServiceDate]', @li_service_date);
					SET @lineitem_row = Replace(@lineitem_row, '[LineItemLastUpdated]', @li_last_updated);
					SET @lineitem_row = Replace(@lineitem_row, '[LineItemLastUpdatedBy]', @li_last_updated_by);

					SET @lineitem_rows = CONCAT(@lineitem_rows, @lineitem_row)
					FETCH NEXT FROM li_cursor INTO @li_row_id, @li_type_name, @li_type_id, @li_gage_idsn, @li_status_name, @li_quantity, @li_service_date, @li_date_created, @li_last_updated, @li_last_updated_by
				END;

		CLOSE li_cursor;
		DEALLOCATE li_cursor;

		SET @email_message = Replace(@email_message, '[LineItemRows]', @lineitem_rows)	
		
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


