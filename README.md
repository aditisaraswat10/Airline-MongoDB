# Airline-MongoDB

This project is designed and built for an Airline Company where the system stores the information about the company and supports a number of queries against the database.

## Getting Started

There are a few assumptions made about the airplane company which are stated in detail in the documentation of the project in a document.

An E-R diagram and a Database Dictionary is also attached in the document for clear understanding about the fields and attributes, along with their datatypes.

All the implementation part has been done using MongoDB Shell, Terminal and Oxygen XML Editor.


### Populating the Database

For populating the database, json files Graphical User Interface for MongoDB, Compass has been used.

Hence we exported the data of each collection as a json file using the command :


```
mongoexport --db AirlineDB --collection <CollectionName> --out <CollectionName>.json
```
The data is imported in the database using the following command in the terminal and not in the mongoDB shell:
```
mongoimport -d <databaseName> -c <CollectionName> <CollectionName>.json
```
For the six collections used to populate manually, the following commands have been used:

```
mongoimport -d AirlineDB -c AIRPORT airports.json
mongoimport -d AirlineDB -c EMPLOYEE employees.json
mongoimport -d AirlineDB -c PLANE planes.json
mongoimport -d AirlineDB -c PASSENGER passengers.json
mongoimport -d AirlineDB -c FLIGHT_BOOKING bookings.json
mongoimport -d AirlineDB -c PLANE_FLIGHT flights.json

```
All the json files are stored in the deliverable folder.



All the queries found in the Queries.js folder are in the javescript (.js) format where a group of functions are performed to solve a few tasks such as:
To set employee id as unique index:

```
db.EMPLOYEE.ensureIndex({EmployeeID: 1},
    {unique: true});
```

Calculate the cost for each booking by summing the cost of each intermediate flight and multiplying it by the number of passangers

```
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
```
A difference between NoSQL and Relational Database in regards to the project has been updated in the deliverable folder along with ER diagram. 

## Explaining and Profiling Utilities:

To see the general information of the database:

```
db.stats()
```
Db.stats() shows the util information like name, amount of collections, size of objects, database state and number of indexes of the existing database- AirlineDB.


To see the cluster-time, operation-time and winning plan (It gives the selected plan by the query optimizer which are based on a tree of stages), the following command has been used:

```
db.FLIGHT_BOOKING.find({bookingCode:1}).explain()”, 

```
The Atlas cluster is used to not only see the collections in the database but also the Network traffic.
 
 

The input flow to the database is represented using the blue lines and the green lines depict the direction of output flow.

## Authors

* **Aditi, Andreas, Yesid **

## Acknowledgments

* Thanks for the teaching and support through-out Tony!
