USE [GageCheckout]
GO

/****** Object: SqlProcedure [dbo].[spAddTicket] Script Date: 2/5/2025 6:03:55 AM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

DROP PROCEDURE [dbo].[spAddTicket];


GO




CREATE PROCEDURE [dbo].[spAddTicket] 
	@site_id								int,
	@ticket_type_id					INT,
	@machine_name					VARCHAR(50),
	@maching_group					INT,
	@department_id					INT,
	@operator_employee_number		VARCHAR(10),
	@operator_name					VARCHAR(150),
	@cell_leader_name				VARCHAR(150),
	@joblot_number					VARCHAR(50),
	@part_number					VARCHAR(50),
	@new_identity					INT OUTPUT,
	@new_ticket_number				VARCHAR(20) OUTPUT
AS
BEGIN

	SET NOCOUNT ON;

    INSERT INTO tblTicket (	SiteID, TicketTypeID, 
							MachineName, 
							MachineGroupID, 
							DepartmentID, 
							OperatorEmployeeNumber, 
							OperatorName, 
							TicketStatusID, 
							CellLeaderName,
							JobLotNumber,
							PartNumber,
							UpdateUserID ) 
					VALUES (@site_id, @ticket_type_id,
							@machine_name,
							@maching_group,
							@department_id,
							@operator_employee_number,
							@operator_name,
							1,
							@cell_leader_name,
							@joblot_number,
							@part_number,
							@operator_employee_number)
							
							
	SELECT @new_identity = SCOPE_IDENTITY()
	
	SELECT @new_ticket_number = (SELECT TicketNumber from tblTicket WHERE tblTicket.ID = @new_identity) 

	SELECT @new_identity AS Id, @new_ticket_number as TicketNumber
	RETURN
END
