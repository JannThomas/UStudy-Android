Example.prototype.getGrades = function(completionHandler) {
    completionHandler(
        [{
                id: '1',
                name: 'First Grade',
                status: 'passed',
                grade: '1,7',
                credits: 3,
                date: new Date(),
                numberOfTry: 1,
                overviewOfGrades: [],
                averageGrade: ''
            },
            {
                id: '2',
                name: 'Second Grade',
                status: 'failed',
                grade: '5',
                credits: 0,
                date: new Date(),
                numberOfTry: 1,
                overviewOfGrades: [],
                averageGrade: ''
            }
        ]
    )
}