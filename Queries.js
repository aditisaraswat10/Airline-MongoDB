//set employeeID as unique index
db.EMPLOYEE.ensureIndex({EmployeeID: 1},
    {unique: true});

//Get just the full name and pilot license number of all the captains
db.PLANE_FLIGHT.find(
    { Role: "Captain" },
    { FullName: 1, "PilotDetails.PilotLicenseNumber": 1 }
);

//copy documents of one collection into another
db.PLANE.find().forEach(function(doc){
    db.PLANE.insert(doc);
});

//Get planes built after 2008
db.PLANE.find({dateBuilt: {$gt: new Date("2008-01-01")}});


//find all employees who are either captains, or they are pilots and their salaray is greater than 20000
db.EMPLOYEE.find({Role: 'Captain',
    $or: [{Role: 'Pilot'},
        {Salary: {$gt: 20000}}]});

//project just the full name of the cabin crew staff, without the _id
db.EMPLOYEE.find({Role: 'Cabin Crew'}, {FullName:1, _id:0});

//sort pilots in ascending order first based on their working startDate (from oldest to most recent) for the company
// and then in descending order based on their salary (from highest paid to lowest paid).
db.EMPLOYEE.find({Role:'Pilot'}).sort({startDate: 1,
    Salary: -1});

//Get the 3rd, 4th and 5th most recent bookings
db.FLIGHT_BOOKING.find().sort({bookingDateTime: -1}).limit(3).skip(2);

//Get the number of flights in November
db.PLANE_FLIGHT.find({departureDateTime: {$gte: new Date("2018-11-01"), $lt: new Date("2018-12-01")}}).count();

//Get what number of our planes are boeing and what are airbus
db.PLANE.aggregate([{$group:{_id:'$Make',
        total: {$sum:1}}}]);

//find all the employees that started working after 2005, group them by their role, sum the number of emlpoyees in each
//role and for each role calculate the average salary of the employees and sort them by descending order based on their
//salary average.
db.EMPLOYEE.aggregate([
    {
        $match: {StartDate:{$gt: new Date("2015-01-01")}}
    },
    {$group: {_id:'$Role', total:{$sum:1},
            avgSal:{$avg:'$Salary'}}},
    {$sort:{avgSal:-1}} ]);

//calculate the arrivalDateTime of a flight based on the estimated duration and departureDateTime
db.PLANE_FLIGHT.aggregate(
    [
        { "$addFields": {
                "arrivalDateTime": { "$add": [ "$departureDateTime", {"$multiply":["$estimatedDuration", (60*1000)]} ] },
            }},
        { "$out": "PLANE_FLIGHT" }
    ]
);

//lower the salary of the employees by 10 times
db.EMPLOYEE.aggregate(
    [
        { "$addFields": {
                "Salary":{"$divide":["$Salary", 10]},
            }},
        { "$out": "EMPLOYEE" }
    ]
);


//Calculate the cost for each booking by summing the cost of each intermediate flight and multiplying it by the number
//of passengers
db.FLIGHT_BOOKING.aggregate([

        {
            $unwind: "$INTERMEDIATE_FLIGHTS"
        },
        {
            $group:
                {
                    _id: "$_id",
                    bookingCode: { $first: ("$bookingCode")},
                    bookingDateTime: { $first: ("$bookingDateTime")},
                    numberOfPassengers: { $first: ("$numberOfPassengers")},
                    cost: { $sum: "$INTERMEDIATE_FLIGHTS.seatCostPerPassenger" },
                    journey: {$first: ("$journey")},
                    passengers: {$first: ("$passengers")},
                    INTERMEDIATE_FLIGHTS: {$push: ("$INTERMEDIATE_FLIGHTS")}
                }
        },
        { "$addFields": {
            "cost":{"$multiply":["$cost", "$numberOfPassengers"]},
        }},
        { "$out": "FLIGHT_BOOKING" }
    ]);


//Calculate the length time of a journey by adding the length times of each intermediate flight
db.FLIGHT_BOOKING.aggregate([

    {
        $unwind: "$INTERMEDIATE_FLIGHTS"
    },
    {
        $group:
            {
                _id: "$_id",
                bookingCode: { $first: ("$bookingCode")},
                bookingDateTime: { $first: ("$bookingDateTime")},
                numberOfPassengers: { $first: ("$numberOfPassengers")},
                cost: {$first: ("$cost")},
                journey: {$first: ("$journey")},
                journeyLengthTime : { $sum: "$INTERMEDIATE_FLIGHTS.totalDuration" },
                passengers: {$first: ("$passengers")},
                INTERMEDIATE_FLIGHTS: {$push: ("$INTERMEDIATE_FLIGHTS")}
            }
    },
    {
        $addFields: {
            "journey.lengthTime": "$journeyLengthTime"
        }
    },
    {$project:{

            _id: 1,
            bookingCode: 1,
            bookingDateTime: 1,
            numberOfPassengers:1,
            cost: 1,
            journey:1,
            passengers: 1,
            INTERMEDIATE_FLIGHTS: 1
        }
    },
    { "$out": "FLIGHT_BOOKING" }
]);

/**
 * Calculate the Final Revenue of the Company for 3 months and put it as a record in the Revenue table
 * 
 */

//function to calculate employee costs
getEmployeeCosts = function(){
    let EmployeeCosts = 0;
    db.EMPLOYEE.find().forEach(function(doc){
        EmployeeCosts+= doc.Salary
    });
    return EmployeeCosts*3;
};

//function to calculate operational costs
getOperationalCosts = function(fromDate, toDate){
    let OperationalCosts = 0;
    db.PLANE_FLIGHT.find({departureDateTime: {$gte: new Date(fromDate), $lt: new Date(toDate)}}).forEach(function(doc){
        OperationalCosts+= doc.operatingCost;
    });
    return OperationalCosts;
};

//function to calculate booking revenue
getBookingRevenue = function(fromDate, toDate){
    let BookingRevenue = 0;
    db.FLIGHT_BOOKING.find({bookingDateTime: {$gte: new Date(fromDate), $lt: new Date(toDate)}}).forEach(function(doc){
        BookingRevenue += doc.cost;
    });
    return BookingRevenue;
};

//function to calculate final revenue
getFinalRevenue = function(fromDate, toDate){
    BookingRevenue = getBookingRevenue(fromDate,toDate);
    OperationalCosts = getOperationalCosts(fromDate,toDate);
    EmployeesCosts = getEmployeeCosts();
    FinalRevenue = BookingRevenue - OperationalCosts - EmployeesCosts;
    FinalRevenueDoc = {
      fromDate: fromDate,
      toDate: toDate,
      EmployeesCost: EmployeesCosts,
      OperationalCosts: OperationalCosts,
        BookingRevenue: BookingRevenue,
      Revenue: FinalRevenue
    };
    db.REVENUE.insert(FinalRevenueDoc);
    return FinalRevenue;
};


getFinalRevenue("2018-11-01","2019-01-01");
