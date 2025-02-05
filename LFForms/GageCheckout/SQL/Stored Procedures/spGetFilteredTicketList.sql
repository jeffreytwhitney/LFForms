
CREATE PROCEDURE [dbo].[spGetFilteredTicketList]
	@site_id smallint = 0,
	@ticket_number varchar(255) = '',
	@ticket_type_id int = 0,
	@operator_name varchar(255) = '',
	@cell_leader_name varchar(255) = '',
	@department_id int = 0,
	@machine_group_id int = 0,
	@page_number int = 1

AS
	BEGIN
		SET NOCOUNT ON;

		Declare @skip_rows int = (@page_number - 1) * 25;
		DECLARE @sql varchar(max) = '';
	
		set @sql = 'SELECT * from qryActiveTickets WHERE SiteID = ' + cast(@site_id as varchar);
	
		if @ticket_number <> ''
			BEGIN
				SET @sql = @sql + ' AND TicketNumber LIKE ''%' + @ticket_number + '%''';
			END

		if @ticket_type_id in (1,2)	
			BEGIN
				SET @sql = @sql + ' AND TicketTypeID = ' + cast(@ticket_type_id as varchar);
			END

		if @operator_name <> ''
			BEGIN
				SET @sql = @sql + ' AND OperatorName = ''' + @operator_name + '''';
			END

		if @cell_leader_name <> ''
			BEGIN
				SET @sql = @sql + ' AND CellLeaderName = ''' + @cell_leader_name + '''';
			END

		if @department_id in (select id from tlkpDepartment where SiteID = @site_id)
			BEGIN
				SET @sql = @sql + ' AND DepartmentID = ' + cast(@department_id as varchar);
			END

		if @machine_group_id in (Select ID from tlkpMachineGroup)
			BEGIN
				SET @sql = @sql + ' AND MachineGroupID = ' + cast(@machine_group_id as varchar);
			END

		SET @sql = @sql + ' ORDER BY TicketNumber OFFSET ' + cast(@skip_rows as varchar) + ' ROWS FETCH NEXT 25 ROWS ONLY';
	  EXEC(@sql);

	END