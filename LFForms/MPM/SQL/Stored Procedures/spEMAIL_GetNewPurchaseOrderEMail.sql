USE [LF_RMS_COMMS_MPM]
GO

/****** Object:  StoredProcedure [spEMAIL_GetNewPurchaseOrderEMail]    Script Date: 10/9/2025 10:43:19 AM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO




CREATE OR ALTER     PROCEDURE [spEMAIL_GetNewPurchaseOrderEMail]
	@purchase_order_id	INT,
	@user_id						VARCHAR(10),
	@email_message			VARCHAR(MAX) OUTPUT
	
AS
	
	BEGIN
	/***************************************************************************************************
	Procedure:      spEMAIL_GetNewPurchaseOrderEMail
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
		@email_message      VARCHAR(MAX) OUTPUT Final composed HTML.

	Template / Property Dependencies:
		tblEMailMessageTemplate (EventName, EMailMessageTemplate)

	Tables Referenced:
		tblPurchaseOrder, tblPurchaseOrderNotes, tblUser

	Tokens Replaced (must appear in template to have effect):
		[Submittor] [Requester] [PurchaseOrderType] [PurchaseOrderName]
		[Description] [Vendor] [Quantity] [TotalCost] [Note]

	Behavior Notes:
		- Note tokens is conditionally populated (bold wrapped) only if there is a note in the notes table.
		- Dates converted mm/dd/yyyy (style 101).

	Error Handling:
		Accumulates validation failures into @error_message and RAISERROR (severity 16) if any:
			- Missing/empty template
			- Invalid @purchase_order_id
			- Invalid @user_id
		  Then RETURNS 0 (caller should trap).

	Example Invocation:
		DECLARE @msg VARCHAR(MAX);
		EXEC spEMAIL_GetNewPurchaseOrderEMail
			 @purchase_order_id = 123,
			 @user_id = '12345',
			 @email_message = @msg OUTPUT;
		SELECT @msg;

	Change Log:
		2025-10-09  Initial Creation.

***************************************************************************************************/

		SET NOCOUNT ON;
		DECLARE @email_message_template varchar(max) = (Select IsNull(EMailMessageTemplate, '') from tblEMailMessageTemplate WHERE EventName = 'PURCHASE_ORDER_ADD')
		DECLARE @add_note Varchar(max) = ''
		DECLARE @error_message nvarchar(max) = ''
		
		if (len(trim(@email_message_template)) = 0) 
			begin
				SET @error_message = @error_message + 'EMail Message Template is Empty.\r\n\'
			end

		If (@purchase_order_id Is Null) OR (@purchase_order_id not in (select ID from tblPurchaseOrder)) 
			begin
				SET @error_message = @error_message + 'Purchase Order ID is invalid or empty.\r\n\'
			end		

		If (@user_id not in (Select EmployeeNumber from tblUser where IsActive = 1)) 
			begin
				SET @error_message = @error_message + 'User ID is Empty.\r\n\'
			end
		
		if @error_message <> ''
			begin
				RAISERROR(@error_message, 16, 1)
				RETURN 0
			end	

		set @email_message = @email_message_template 
		DECLARE @submittor_name varchar(255) = (Select FullName from tblUser where EmployeeNumber = @user_id and ISActive = 1)
		DECLARE @purchase_order_type varchar(255)
		DECLARE @purchase_order_status varchar(255)
		DECLARE @purchase_order_type_id INT
		DECLARE @site_id int
		DECLARE @site_name varchar(255)
		DECLARE @vendor varchar(255)
		DECLARE @description varchar(max)
		DECLARE @gage_idsn varchar(500)
		DECLARE @total_cost varchar(50)
		DECLARE @quantity varchar(10)
		DECLARE @requester_name varchar(255)
		DECLARE @date_created varchar(100)
		DECLARE @last_updated	varchar(100)
		DECLARE @last_updated_by varchar(255)
		DECLARE @note_text varchar(max) = ''
		DECLARE @note_count INT = (Select Count(*) from tblPurchaseOrderNotes where poID = @purchase_order_id)
		IF @note_count > 0
			BEGIN
				SET @note_text = (Select poNote from tblPurchaseOrderNotes 
													where ID = (Select Min(ID) from tblPurchaseOrderNotes where poID = @purchase_order_id))
			END
		

		DECLARE db_cursor CURSOR FOR SELECT SiteID, PurchaseOrderTypeID, PurchaseOrderType, Vendor, GageIDSN, Format(TotalCost, 'C') as TotalCost, Description, 
																				STR(Quantity) as Quantity, PurchaseOrderStatus, RequesterName, UpdatedBy, 
																				CONVERT(varchar, DateCreated, 101) as DateCreated, CONVERT(varchar, LastUpdated, 101) as LastUpdated
																	FROM qryPurchaseOrderList where ID = @purchase_order_id;
		OPEN db_cursor;
		
		FETCH NEXT FROM db_cursor INTO	@site_id, @purchase_order_type_id, @purchase_order_type, @vendor, @gage_idsn, @total_cost, @description, @quantity, 
																		@purchase_order_status, @requester_name, @last_updated_by, @date_created, @last_updated

		CLOSE db_cursor;
		DEALLOCATE db_cursor;

		set @email_message = Replace(@email_message, '[Submittor]',@submittor_name);
		set @email_message = Replace(@email_message, '[Requester]', @submittor_name)
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
		set @email_message = Replace(@email_message, '[Note]', @note_text)
		
		IF @site_id = 1
			BEGIN
				set @email_message = Replace(@email_message, '[SITECODE]', 'CR');
			END
		IF @site_id = 2
			BEGIN
				set @email_message = Replace(@email_message, '[SITECODE]', 'ANK');
			END

		Select @email_message
		RETURN
	END
GO


