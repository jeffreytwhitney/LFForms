USE [LF_RMS_COMMS_MPM]
GO

/****** Object:  StoredProcedure [spPURCHASEORDER_GetFilteredList]    Script Date: 10/9/2025 5:16:30 AM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO




CREATE OR ALTER PROCEDURE [spPURCHASEORDER_GetFilteredList]
  @pg int = 1,
	@site_id int,
	@purchase_order_number varchar(50),
	@purchase_order_name varchar(100),
	@requester_id int = 0,
	@vendor_name varchar(255),
	@date_min varchar(15),
	@date_max varchar(15),
	@include_completed smallint = 0,
	@sort_field_ordinal int = 0,
	@sort_direction int = 0
AS
	BEGIN

		SET NOCOUNT ON;
		DECLARE @skip_rows int = (@pg - 1) * 25;
		DECLARE @sql varchar(max) = '';
		DECLARE @sort_field varchar(255);
		
		SET @purchase_order_number = ISNULL(@purchase_order_number, '')
		SET @purchase_order_name = ISNULL(@purchase_order_name, '')
		SET @vendor_name = ISNULL(@vendor_name, '')
		SET @date_min = ISNULL(@date_min, '')
		SET @date_max = ISNULL(@date_max, '')

		if @sort_field_ordinal IS NULL
			BEGIN
				SET @sort_field_ordinal = 0
			END

		if @sort_direction IS NULL
			BEGIN
				SET @sort_direction = 0
			END


		IF @include_completed = 1
			SET @sql = 'SELECT * FROM qryPurchaseOrderList WHERE SiteID = ' + cast(@site_id as varchar);
		ELSE
			BEGIN
				SET @sql = 'SELECT * FROM qryPurchaseOrderList WHERE SiteID = ' + cast(@site_id as varchar) + ' AND PurchaseOrderStatusID in (1,2)';
			END


		if @purchase_order_number <> ''
			BEGIN
				SET @sql = @sql + ' AND PurchaseOrderNumber LIKE ''%' + @purchase_order_number + '%''';
			END

		if @purchase_order_name <> ''
			BEGIN
				SET @sql = @sql + ' AND GageIDSN LIKE ''%' + @purchase_order_name + '%''';
			END

		if @vendor_name <> ''
			BEGIN
				SET @sql = @sql + ' AND Vendor LIKE ''%' + @vendor_name + '%''';
			END

		if @date_min <> ''
			BEGIN
				SET @sql = @sql + ' AND DateCreated >= ''' + @date_min + ' 12:00:00 AM''';
			END

		if @date_max <> ''
			BEGIN
				SET @sql = @sql + ' AND DateCreated <= ''' + @date_max + ' 12:59:59 PM''';
			END

		if @requester_id in (select ID from tblUser)
			BEGIN
					SET @sql = @sql + ' AND RequestorID = ' + cast(@requester_id as varchar);
			END



		set @sort_field = CASE 
				WHEN @sort_field_ordinal = 0 THEN ' ORDER BY DateCreated'
        WHEN @sort_field_ordinal = 1 THEN ' ORDER BY PurchaseOrderNumber'
        WHEN @sort_field_ordinal = 2 THEN ' ORDER BY PurchaseOrderStatus'
				WHEN @sort_field_ordinal = 3 THEN ' ORDER BY Vendor'
				WHEN @sort_field_ordinal = 4 THEN ' ORDER BY GageIDSN'
				WHEN @sort_field_ordinal = 5 THEN ' ORDER BY RequesterName'
				WHEN @sort_field_ordinal = 6 THEN ' ORDER BY PurchaseOrderType'
        ELSE ' ORDER BY DateCreated'
    END

		SET @sql = @sql + @sort_field
		
		if @sort_direction = 1
			BEGIN
				SET @sql = @sql + ' DESC'
			END

		SET @sql = @sql + ' OFFSET ' + cast(@skip_rows as varchar) + ' ROWS FETCH NEXT 25 ROWS ONLY';

		print @sql
		Exec(@sql);
	END
GO


