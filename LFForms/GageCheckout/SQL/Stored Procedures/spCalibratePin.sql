USE [GageCheckout]
GO

/****** Object: SqlProcedure [dbo].[spCalibratePin] Script Date: 2/7/2025 7:40:31 AM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

DROP PROCEDURE [dbo].[spCalibratePin];


GO

CREATE   PROCEDURE [dbo].[spCalibratePin] 
	@pin_checkout_detail_id			INT,
	@pin_calibration_result_id		INT,
	@operator_employee_id			VARCHAR(10)
AS
BEGIN

	SET NOCOUNT ON;
	DECLARE @ticket_id as INT
	DECLARE @count_of_active_pins as INT
	DECLARE @calibration_due_date as DATE
	Declare @calibration_id as int
	
	IF @pin_calibration_result_id = 1 OR @pin_calibration_result_id = 4
		BEGIN
			INSERT INTO [dbo].[tblPinCalibration]
				(PinCheckoutDetailID
				,PinCalibrationResultID
				,UpdateUserID)
			VALUES
				(@pin_checkout_detail_id
				,@pin_calibration_result_id
				,@operator_employee_id)

			SELECT @calibration_id = SCOPE_IDENTITY()


			EXEC spGetPinCalibrationDueDate @pin_checkout_detail_id, @calibration_due_date OUTPUT
			
			/* Update the Cal info in the pin detail table*/
			UPDATE	tblPinCheckoutDetail
			SET		LastCalibrationDate		= CURRENT_TIMESTAMP,
					LastCalibratedBy		= @operator_employee_id,
					CalibrationDueDate		= @calibration_due_date,
					UpdateUserID			= @operator_employee_id,
					UpdatedTimestamp		= CURRENT_TIMESTAMP
			WHERE	ID						= @pin_checkout_detail_id

			/* Add Cal info to History table including PinCalibrationID, which is a link to the specific calibration record*/
			INSERT INTO tblPinCheckoutHistory (	PinCheckoutDetailID, 
																					RecordEventTypeID, 
																					PinCalibrationID, 
																					GageStatusID, 
																					LastCalibratedBy, 
																					LastCalibrationDate, 
																					CalibrationDueDate,
																					UpdateUserID)
			Select ID, 3, @calibration_id, GageStatusID, LastCalibratedBy, CURRENT_TIMESTAMP, @calibration_due_date, @operator_employee_id
			from tblPinCheckoutDetail WHERE	ID = @pin_checkout_detail_id
		END
	ELSE
		BEGIN
			IF @pin_calibration_result_id = 2 
				BEGIN
					UPDATE	tblPinCheckoutDetail
					SET		GageStatusID			= 2,
							UpdateUserID			= @operator_employee_id,
							UpdatedTimestamp		= CURRENT_TIMESTAMP
					WHERE	ID						= @pin_checkout_detail_id
				END
		
			IF @pin_calibration_result_id = 3 
				BEGIN
					UPDATE	tblPinCheckoutDetail
					SET		GageStatusID			= 3,
							UpdateUserID			= @operator_employee_id,
							UpdatedTimestamp		= CURRENT_TIMESTAMP
					WHERE	ID						= @pin_checkout_detail_id
				END

			SET @ticket_id = (	SELECT TicketID 
								FROM tblPinCheckoutDetail
								WHERE ID = @pin_checkout_detail_id)

			SET	@count_of_active_pins = (	SELECT COUNT(ID) 
											FROM tblPinCheckoutDetail
											WHERE	TicketID		= @ticket_id 
											AND		GageStatusID	= 1)

			IF @count_of_active_pins = 0
				BEGIN
					UPDATE tblTicket
					SET	TicketStatusID		= 2, 
					UpdatedTimestamp		= CURRENT_TIMESTAMP,
					UpdateUserID			= @operator_employee_id
					WHERE ID				= @ticket_id			
				END
		END

END
