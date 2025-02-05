CREATE VIEW dbo.qryDistinctMachineNames
AS
SELECT DISTINCT TaskName, LinkedTableNameID, MachineName
FROM            dbo.tblImportMachineName
GO
