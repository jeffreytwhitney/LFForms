USE [GageCheckout]
GO

SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE spGenerateOverDueEmailTextByCellLeaderID
	@cell_leader_id int
AS
	BEGIN
		/*Templates*/
	
		DECLARE @thread_gage_detail_row_template as varchar(255) = '<tr><td>[ThreadGageName]</td><td>[ThreadGageDescription]</td></tr>'
		DECLARE @thread_gage_detail_table_template as varchar(max) = '<table style="padding-left: 20px; text-align: left; width: 350px; border-spacing: 0px;"><thead><tr><th>Thread Gage Name</th><th>Description</th></tr></thead><tbody>[ThreadGageDetailRows]</tbody></table>'
		DECLARE @pin_detail_row_template as varchar(255) = '<tr><td>[PinType]</td><td>[PinDiameter]</td><td>[NumberOfPins]</td><td>[BinNumber]</td>'
		DECLARE @pin_detail_table_template as varchar(max) = '<table style="padding-left: 20px; text-align: left; width: 550px; border-spacing: 0px;"><thead><tr><th>Pin Type</th><th>Pin Diameter</th><th>Number Of Pins</th><th>Bin Number</th></tr></thead><tbody>[PinDetailRows]</tbody></table>'
		DECLARE @ticket_row_template as varchar(max) = '<tr><td>[TicketNumber]</td><td>[TicketType]</td><td>[TicketOperator]</td><td>[TicketPartNumber]</td><td>[TicketMachine]</td><td>[TicketCalDueDate]</td></tr><tr><td colspan="6">[GageDetailTable]<br/></td></tr>'
		DECLARE @email_template as varchar(max) = '<p>There are gages in your area that are overdue for calibration.</p><p>Please have your people locate these gages and bring them in to be calibrated.</p><br /><div><h2>Tickets</h2></div><div><style>td, th {border: 1px solid; border-collapse: collapse; text-align: left; border-spacing: 0px; padding: 0px;}</style><table style="width: 800px; border-spacing: 0px;"><thead><tr><th>Ticket Number</th><th>Ticket Type</th><th>Operator</th><th>Part Number</th><th>Machine</th><th>Calibration Due Date</th></tr></thead><tbody>[TicketRows]</tbody></table></div>'


		/*Working Variables*/
		DECLARE @email as varchar(max) ;

		DECLARE @thread_gage_detail_row as varchar(max);
		DECLARE @thread_gage_detail_rows as varchar(max) = '';
		DECLARE @thread_gage_detail_table as varchar(max);
		DECLARE @thread_gage_name as varchar(255);
		DECLARE @thread_gage_description as varchar(255);

		DECLARE @pin_detail_row as varchar(max);
		Declare @pin_detail_rows as varchar(max) = '';
		DECLARE @pin_detail_table as varchar(max);
		DECLARE @pin_type as varchar(50);
		DECLARE @pin_diameter as varchar(10);
		DECLARE @number_of_pins as varchar(5);
		DECLARE @bin_number as varchar(50);

	
		DECLARE @ticket_rows as varchar(max) = '';
		Declare @ticket_row as varchar(max);

		DECLARE @ticket_id as INT;
		DECLARE @ticket_type_id as INT;

		DECLARE @ticket_number as varchar(50);
		DECLARE @ticket_type as varchar(50);
		DECLARE @ticket_operator as varchar (255);
		DECLARE @ticket_part_number as varchar (255);
		DECLARE @ticket_machine as varchar (255);
		DECLARE @ticket_cal_due_date as varchar(15);


		SET @email = @email_template

		DECLARE db_ticket_cursor CURSOR FOR SELECT ID, TicketTypeID, TicketNumber, TicketType, OperatorName, PartNumber, MachineName, CONVERT(varchar, CalibrationDueDate, 101)
																	FROM qryOverdueTickets where CellLeaderID = @cell_leader_id;
		OPEN db_ticket_cursor;
		
		FETCH NEXT FROM db_ticket_cursor INTO @ticket_id, @ticket_type_id, @ticket_number, @ticket_type, @ticket_operator, @ticket_part_number, @ticket_machine, @ticket_cal_due_date;
		WHILE @@FETCH_STATUS = 0  
			BEGIN 
				SET @ticket_row = @ticket_row_template
				SET @ticket_row = Replace(@ticket_row, '[TicketNumber]', @ticket_number);
				SET @ticket_row = Replace(@ticket_row, '[TicketType]', @ticket_type);
				SET @ticket_row = Replace(@ticket_row, '[TicketOperator]', @ticket_operator);
				SET @ticket_row = Replace(@ticket_row, '[TicketPartNumber]', @ticket_part_number);
				SET @ticket_row = Replace(@ticket_row, '[TicketMachine]', @ticket_machine);
				SET @ticket_row = Replace(@ticket_row, '[TicketCalDueDate]', @ticket_cal_due_date);
				
				IF @ticket_type_id = 1
					BEGIN
						SET @pin_detail_rows = ''
						SET @pin_detail_table = @pin_detail_table_template

						DECLARE db_pin_cursor CURSOR FOR SELECT PinType, Convert(varchar, NumberOfPins), CONVERT(varchar, PinDiameter), BinName from qryActivePins WHERE ID = @ticket_id
						OPEN db_pin_cursor
						FETCH NEXT FROM db_pin_cursor INTO @pin_type, @number_of_pins, @pin_diameter, @bin_number
							WHILE @@FETCH_STATUS = 0  
								BEGIN 
									IF @pin_type = 'BIN'
										BEGIN
											SET @number_of_pins = '';
											SET @pin_diameter = '';
										END
										SET @pin_detail_row = @pin_detail_row_template
										SET @pin_detail_row = Replace(@pin_detail_row, '[PinType]', @pin_type);
										SET @pin_detail_row = Replace(@pin_detail_row, '[PinDiameter]', @number_of_pins);
										SET @pin_detail_row = Replace(@pin_detail_row, '[NumberOfPins]', @pin_diameter);
										SET @pin_detail_row = Replace(@pin_detail_row, '[BinNumber]', @bin_number);
										
										SET @pin_detail_rows = @pin_detail_rows + @pin_detail_row;
									FETCH NEXT FROM db_pin_cursor INTO @pin_type, @number_of_pins, @pin_diameter, @bin_number
								END
						 SET @pin_detail_table = Replace(@pin_detail_table, '[PinDetailRows]', @pin_detail_rows);
						 SET @ticket_row = Replace(@ticket_row, '[GageDetailTable]', @pin_detail_table);
						 CLOSE db_pin_cursor;
						 DEALLOCATE db_pin_cursor;
					END

				Else IF @ticket_type_id = 2
					BEGIN
						SET @thread_gage_detail_rows = '';
						SET @thread_gage_detail_table = @thread_gage_detail_table_template;
						DECLARE db_thread_cursor CURSOR FOR SELECT ThreadGageName, ThreadDescription from qryActiveThreadGages WHERE ID = @ticket_id
						OPEN db_thread_cursor
						FETCH NEXT FROM db_thread_cursor INTO @thread_gage_name, @thread_gage_description
							WHILE @@FETCH_STATUS = 0  
								BEGIN 
									SET @thread_gage_detail_row = @thread_gage_detail_row_template
									SET @thread_gage_detail_row = Replace(@thread_gage_detail_row, '[ThreadGageName]', @thread_gage_name);
									SET @thread_gage_detail_row = Replace(@thread_gage_detail_row, '[ThreadGageDescription]', @thread_gage_description);
									SET @thread_gage_detail_rows = @thread_gage_detail_rows + @thread_gage_detail_row;
									FETCH NEXT FROM db_thread_cursor INTO @thread_gage_name, @thread_gage_description
								END
						SET @thread_gage_detail_table = Replace(@thread_gage_detail_table, '[ThreadGageDetailRows]', @thread_gage_detail_rows);
						SET @ticket_row = Replace(@ticket_row, '[GageDetailTable]', @thread_gage_detail_table);
						CLOSE db_thread_cursor;
						DEALLOCATE db_thread_cursor;
					END

				SET @ticket_rows = @ticket_rows + @ticket_row

				FETCH NEXT FROM db_ticket_cursor INTO @ticket_id, @ticket_type_id, @ticket_number, @ticket_type, @ticket_operator, @ticket_part_number, @ticket_machine, @ticket_cal_due_date;
			END

			CLOSE db_ticket_cursor;
			DEALLOCATE db_ticket_cursor;

			SET @email = Replace(@email, '[TicketRows]', @ticket_rows);
			Select @email
	END






