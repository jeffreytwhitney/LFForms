CREATE VIEW dbo.qryAvailableJobNumbers
AS
SELECT        ID, JobNumber
FROM            dbo.tblAllJobNumbers
WHERE        (JobNumber NOT IN
                             (SELECT        JobNumber
                               FROM            dbo.tblJobNumber))
