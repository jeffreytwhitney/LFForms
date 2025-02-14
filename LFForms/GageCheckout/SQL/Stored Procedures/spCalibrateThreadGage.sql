DROP PROCEDURE IF EXISTS [dbo].[spCalibrateThreadGage]
go

CREATE PROCEDURE [dbo].[spCalibrateThreadGage] 
	@threadgage_checkout_detail_id			INT,
	@thread_calibration_result_id			INT,
	@thread_calibration_pitch_diameter		DECIMAL(9,5),
	@operator_employee_id					VARCHAR(10)
AS
BEGIN

	SET NOCOUNT ON;
	DECLARE @ticket_id as INT
	DECLARE @calibration_due_date as DATE
	DECLARE @count_of_active_threads INT
	Declare @calibration_id as int

	IF @thread_calibration_result_id < 4
		BEGIN
			EXEC spGetThreadCalibrationDueDate @threadgage_checkout_detail_id, @calibration_due_date OUTPUT
			INSERT INTO [dbo].[tblThreadCalibration]
				(ThreadGageCheckoutDetailID
				,CalibrationResultID
				,CalibrationThreadDiameter
				,UpdateUserID)
			VALUES
				(@threadgage_checkout_detail_id
				,@thread_calibration_result_id
				,@thread_calibration_pitch_diameter
				,@operator_employee_id)
			
			SET @calibration_id = SCOPE_IDENTITY()

			UPDATE	tblThreadCheckoutDetail
			SET		LastCalibrationDate		= CURRENT_TIMESTAMP,
					LastCalibratedBy		= @operator_employee_id,
					CalibrationDueDate		= @calibration_due_date,
					UpdateUserID			= @operator_employee_id,
					UpdatedTimestamp		= CURRENT_TIMESTAMP
			WHERE	ID						= @threadgage_checkout_detail_id
			/* The trigger on the cal table writes the history record */

		END
	ELSE
		/*Thread Gage marked as 'missing'*/
		BEGIN
			UPDATE	tblThreadCheckoutDetail
			SET		GageStatusID		= 2, 
					UpdatedTimestamp	= CURRENT_TIMESTAMP,
					UpdateUserID		= @operator_employee_id
			WHERE	ID					= @threadgage_checkout_detail_id

			SET @ticket_id = (	Select TicketID from tblThreadCheckoutDetail WHERE ID = @threadgage_checkout_detail_id )

			SET	@count_of_active_threads = (	SELECT COUNT(ID) 
											FROM tblThreadCheckoutDetail
											WHERE	TicketID		= @ticket_id 
											AND		GageStatusID	= 1)

			IF @count_of_active_threads = 0
				BEGIN
					UPDATE	tblTicket
					SET		TicketStatusID		= 2, 
							UpdatedTimestamp	= CURRENT_TIMESTAMP,
							UpdateUserID		= @operator_employee_id
					WHERE	ID					= @ticket_id
				END
		END 
	
END