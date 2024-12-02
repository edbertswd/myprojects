#!/usr/bin/env python3
# Imports
import pg8000
import configparser
import sys

#  Common Functions
##     database_connect()
##     dictfetchall(cursor,sqltext,params)
##     dictfetchone(cursor,sqltext,params)
##     print_sql_string(inputstring, params)


################################################################################
# Connect to the database
#   - This function reads the config file and tries to connect
#   - This is the main "connection" function used to set up our connection
################################################################################

def database_connect():
    # Read the config file
    config = configparser.ConfigParser()
    config.read('config.ini')

    # Create a connection to the database
    connection = None

    # choose a connection target, you can use the default or
    # use a different set of credentials that are setup for localhost or winhost
    connectiontarget = 'DATABASE'
    try:
        '''
        This is doing a couple of things in the back
        what it is doing is:

        connect(database='y2?i2120_unikey',
            host='awsprddbs4836.shared.sydney.edu.au,
            password='password_from_config',
            user='y2?i2120_unikey')
        '''
        targetdb = ""
        if ('database' in config[connectiontarget]):
            targetdb = config[connectiontarget]['database']
        else:
            targetdb = config[connectiontarget]['user']

        connection = pg8000.connect(database=targetdb,
                                    user=config[connectiontarget]['user'],
                                    password=config[connectiontarget]['password'],
                                    host=config[connectiontarget]['host'],
                                    port=int(config[connectiontarget]['port']))
        connection.run("SET SCHEMA 'airline';")
    except pg8000.OperationalError as e:
        print("""Error, you haven't updated your config.ini or you have a bad
        connection, please try again. (Update your files first, then check
        internet connection)
        """)
        print(e)
    except pg8000.ProgrammingError as e:
        print("""Error, config file incorrect: check your password and username""")
        print(e)
    except Exception as e:
        print(e)

    # Return the connection to use
    return connection

######################################
# Database Helper Functions
######################################
def dictfetchall(cursor,sqltext,params=[]):
    """ Returns query results as list of dictionaries."""
    """ Useful for read queries that return 1 or more rows"""

    result = []
    
    cursor.execute(sqltext,params)
    if cursor.description is not None:
        cols = [a[0] for a in cursor.description]
        
        returnres = cursor.fetchall()
        if returnres is not None or len(returnres > 0):
            for row in returnres:
                result.append({a:b for a,b in zip(cols, row)})

    print("returning result: ",result)
    return result

def dictfetchone(cursor,sqltext,params=None):
    """ Returns query results as list of dictionaries."""
    """ Useful for create, update and delete queries that only need to return one row"""

    result = []
    cursor.execute(sqltext,params)
    if (cursor.description is not None):
        print("cursor description", cursor.description)
        cols = [a[0] for a in cursor.description]
        returnres = cursor.fetchone()
        print("returnres: ", returnres)
        if (returnres is not None):
            result.append({a:b for a,b in zip(cols, returnres)})
    return result

##################################################
# Print a SQL string to see how it would insert  #
##################################################

def print_sql_string(inputstring, params=None):
    """
    Prints out a string as a SQL string parameterized assuming all strings
    """
    if params is not None:
        if params != []:
           inputstring = inputstring.replace("%s","'%s'")
    
    print(inputstring % params)

###############
# Login       #
###############

def check_login(username, password):
    '''
    Check Login given a username and password
    '''
    # Ask for the database connection, and get the cursor set up
    conn = database_connect()
    print("checking login")

    if(conn is None):
        return None
    cur = conn.cursor()
    try:
        # Try executing the SQL and get from the database
        
        sql = """SELECT *
                FROM Users
                    JOIN UserRoles ON
                        (Users.userroleid = UserRoles.userroleid)
                WHERE userid=%s AND password=%s"""
        print_sql_string(sql, (username, password))
        r = dictfetchone(cur, sql, (username, password)) # Fetch the first row
        cur.close()                     # Close the cursor
        conn.close()                    # Close the connection to the db
        return r
    except:
        # If there were any errors, return a NULL row printing an error to the debug
        import traceback
        traceback.print_exc()
        print("Error Invalid Login")
    cur.close()                     # Close the cursor
    conn.close()                    # Close the connection to the db
    return None
    
########################
#List All Items#
########################

# Get all the rows of users and return them as a dict
def list_users():
    # Get the database connection and set up the cursor
    conn = database_connect()
    if(conn is None):
        # If a connection cannot be established, send an Null object
        return None
    # Set up the rows as a dictionary
    cur = conn.cursor()
    returndict = None

    try:
        # Set-up our SQL query
        sql = """SELECT *
                    FROM users """
        
        # Retrieve all the information we need from the query
        returndict = dictfetchall(cur,sql)

        # report to the console what we recieved
        print(returndict)
    except:
        # If there are any errors, we print something nice and return a null value
        import traceback
        traceback.print_exc()
        print("Error Fetching from Database", sys.exc_info()[0])

    # Close our connections to prevent saturation
    cur.close()
    conn.close()

    # return our struct
    return returndict
    

def list_userroles():
    # Get the database connection and set up the cursor
    conn = database_connect()
    if(conn is None):
        # If a connection cannot be established, send an Null object
        return None
    # Set up the rows as a dictionary
    cur = conn.cursor()
    returndict = None

    try:
        # Set-up our SQL query
        sql = """SELECT *
                    FROM userroles """
        
        # Retrieve all the information we need from the query
        returndict = dictfetchall(cur,sql)

        # report to the console what we recieved
        print(returndict)
    except:
        # If there are any errors, we print something nice and return a null value
        print("Error Fetching from Database", sys.exc_info()[0])

    # Close our connections to prevent saturation
    cur.close()
    conn.close()

    # return our struct
    return returndict
    

########################
#List Single Items#
########################

# Get all rows in users where a particular attribute matches a value
def list_users_equifilter(attributename, filterval):
    # Get the database connection and set up the cursor
    conn = database_connect()
    if(conn is None):
        # If a connection cannot be established, send an Null object
        return None
    # Set up the rows as a dictionary
    cur = conn.cursor()
    val = None

    try:
        # Retrieve all the information we need from the query
        sql = f"""SELECT *
                    FROM users
                    WHERE {attributename} = %s """
        val = dictfetchall(cur,sql,(filterval,))
    except:
        # If there are any errors, we print something nice and return a null value
        import traceback
        traceback.print_exc()
        print("Error Fetching from Database: ", sys.exc_info()[0])

    # Close our connections to prevent saturation
    cur.close()
    conn.close()

    # return our struct
    return val
    


########################### 
#List Report Items #
###########################
    
# # A report with the details of Users, Userroles
def list_consolidated_users():
    # Get the database connection and set up the cursor
    conn = database_connect()
    if(conn is None):
        # If a connection cannot be established, send an Null object
        return None
    # Set up the rows as a dictionary
    cur = conn.cursor()
    returndict = None

    try:
        # Set-up our SQL query
        sql = """SELECT *
                FROM users 
                    JOIN userroles 
                    ON (users.userroleid = userroles.userroleid) ;"""
        
        # Retrieve all the information we need from the query
        returndict = dictfetchall(cur,sql)

        # report to the console what we recieved
        print(returndict)
    except:
        # If there are any errors, we print something nice and return a null value
        print("Error Fetching from Database", sys.exc_info()[0])

    # Close our connections to prevent saturation
    cur.close()
    conn.close()

    # return our struct
    return returndict

def list_user_stats():
    # Get the database connection and set up the cursor
    conn = database_connect()
    if(conn is None):
        # If a connection cannot be established, send an Null object
        return None
    # Set up the rows as a dictionary
    cur = conn.cursor()
    returndict = None

    try:
        # Set-up our SQL query
        sql = """SELECT userroleid, COUNT(*) as count
                FROM users 
                    GROUP BY userroleid
                    ORDER BY userroleid ASC ;"""
        
        # Retrieve all the information we need from the query
        returndict = dictfetchall(cur,sql)

        # report to the console what we recieved
        print(returndict)
    except:
        # If there are any errors, we print something nice and return a null value
        print("Error Fetching from Database", sys.exc_info()[0])

    # Close our connections to prevent saturation
    cur.close()
    conn.close()

    # return our struct
    return returndict
    

####################################
##  Search Items - inexact matches #
####################################

# Search for users with a custom filter
# filtertype can be: '=', '<', '>', '<>', '~', 'LIKE'
def search_users_customfilter(attributename, filtertype, filterval):
    # Get the database connection and set up the cursor
    conn = database_connect()
    if(conn is None):
        # If a connection cannot be established, send an Null object
        return None

    # Set up the rows as a dictionary
    cur = conn.cursor()
    val = None

    # arrange like filter
    filtervalprefix = ""
    filtervalsuffix = ""
    if str.lower(filtertype) == "like":
        filtervalprefix = "'%"
        filtervalsuffix = "%'"
        
    try:
        # Retrieve all the information we need from the query
        sql = f"""SELECT *
                    FROM users
                    WHERE lower({attributename}) {filtertype} {filtervalprefix}lower(%s){filtervalsuffix} """
        print_sql_string(sql, (filterval,))
        val = dictfetchall(cur,sql,(filterval,))
    except:
        # If there are any errors, we print something nice and return a null value
        import traceback
        traceback.print_exc()
        print("Error Fetching from Database: ", sys.exc_info()[0])

    # Close our connections to prevent saturation
    cur.close()
    conn.close()

    # return our struct
    return val


#####################################
##  Update Single Items by PK       #
#####################################


# Update a single user
def update_single_user(userid, firstname, lastname,userroleid,password):
    # Get the database connection and set up the cursor
    conn = database_connect()
    if(conn is None):
        # If a connection cannot be established, send an Null object
        return None
    # Set up the rows as a dictionary
    cur = conn.cursor()
    val = None

    # Data validation checks are assumed to have been done in route processing

    try:
        setitems = ""
        attcounter = 0
        if firstname is not None:
            setitems += "firstname = %s\n"
            attcounter += 1
        if lastname is not None:
            if attcounter != 0:
                setitems += ","
            setitems += "lastname = %s\n"
            attcounter += 1
        if userroleid is not None:
            if attcounter != 0:
                setitems += ","
            setitems += "userroleid = %s::bigint\n"
            attcounter += 1
        if password is not None:
            if attcounter != 0:
                setitems += ","
            setitems += "password = %s\n"
            attcounter += 1
        # Retrieve all the information we need from the query
        sql = f"""UPDATE users
                    SET {setitems}
                    WHERE userid = {userid};"""
        print_sql_string(sql,(firstname, lastname,userroleid,password))
        val = dictfetchone(cur,sql,(firstname, lastname,userroleid,password))
        conn.commit()
        
    except:
        # If there are any errors, we print something nice and return a null value
        print("Error Fetching from Database: ", sys.exc_info()[0])
        print(sys.exc_info())

    # Close our connections to prevent saturation
    cur.close()
    conn.close()

    # return our struct
    return val


##  Insert / Add

def add_user_insert(userid, firstname, lastname,userroleid,password):
    """
    Add a new User to the system
    """
    # Data validation checks are assumed to have been done in route processing

    conn = database_connect()
    if(conn is None):
        return None
    cur = conn.cursor()
    sql = """
        INSERT into Users(userid, firstname, lastname, userroleid, password)
        VALUES (%s,%s,%s,%s,%s);
        """
    print_sql_string(sql, (userid, firstname, lastname,userroleid,password))
    try:
        # Try executing the SQL and get from the database

        cur.execute(sql,(userid, firstname, lastname,userroleid,password))
        
        # r = cur.fetchone()
        r=[]
        conn.commit()                   # Commit the transaction
        print("return val is:")
        print(r)
        cur.close()                     # Close the cursor
        conn.close()                    # Close the connection to the db
        return r
    except:
        # If there were any errors, return a NULL row printing an error to the debug
        print("Unexpected error adding a user:", sys.exc_info()[0])
        cur.close()                     # Close the cursor
        conn.close()                    # Close the connection to the db
        raise

##  Delete
###     delete_user(userid)
def delete_user(userid):
    """
    Remove a user from your system
    """
    # Data validation checks are assumed to have been done in route processing
    conn = database_connect()
    if(conn is None):
        return None
    cur = conn.cursor()
    try:
        # Try executing the SQL and get from the database
        sql = f"""
        DELETE
        FROM users
        WHERE userid = '{userid}';
        """

        cur.execute(sql,())
        conn.commit()                   # Commit the transaction
        r = []
        # r = cur.fetchone()
        # print("return val is:")
        # print(r)
        cur.close()                     # Close the cursor
        conn.close()                    # Close the connection to the db
        return r
    except:
        # If there were any errors, return a NULL row printing an error to the debug
        print("Unexpected error deleting  user with id ",userid, sys.exc_info()[0])
        cur.close()                     # Close the cursor
        conn.close()                    # Close the connection to the db
        raise



# Show all flights
def show_all_flights():
    """
    Show all flights in the database
    """
    conn = database_connect()
    if conn is None:
        return None

    cur = conn.cursor()
    sql = "SELECT * FROM Flights;"

    try:
        # Execute the SQL statement
        cur.execute(sql)
        
        r = cur.fetchall()  # Fetch all flights
        conn.commit()  # Commit the transaction
        print("return val is:")
        print(r)
        return r
    except Exception as e:
        # If there were any errors, print an error to the debug
        print("Unexpected error fetching flights:", e)
        raise
    finally:
        cur.close()  # Close the cursor
        conn.close()  # Close the connection to the database

def get_flight_by_id(flight_id):
    """
    Retrieve a flight by its ID from the database.
    """
    conn = database_connect()
    if conn is None:
        return None

    cur = conn.cursor()
    sql = "SELECT * FROM Flights WHERE FlightID = %s;"

    try:
        # Try executing the SQL to fetch the flight
        cur.execute(sql, (flight_id,))
        flight = cur.fetchone()  # Fetch the flight details
        
        return flight
    except Exception as e:
        # If there are any errors, print an error message
        print("Unexpected error fetching flight by ID:", e)
        return None
    finally:
        cur.close()  # Close the cursor
        conn.close()  # Close the connection to the database


#Remove flight by id
def remove_flight_by_id(flight_id):
    """
    Remove the flight with the given id from the database.
    """
    conn = database_connect()
    if conn is None:
        return None

    cur = conn.cursor()
    sql = "DELETE FROM Flights WHERE FlightID = %s;"

    try:
        # Execute the delete statement
        cur.execute(sql, (flight_id,))
        conn.commit()  # Commit the transaction
        print(f"Flight with ID {flight_id} has been removed.")
        return True  # Indicate success
    except Exception as e:
        print("Unexpected error removing flight by ID:", e)
        raise
    finally:
        cur.close()  # Close the cursor
        conn.close()  # Close the connection to the database




# Add new flight into the database
def add_new_flight(flight_id, flight_number, departure_airport_id, arrival_airport_id, departure_time, arrival_time, aircraft_id):
    """
    Add new flight.
    """
    conn = database_connect()
    if conn is None:
        return None

    cur = conn.cursor()
    sql = """
       INSERT INTO Flights (FlightID, FlightNumber, DepartureAirportID, ArrivalAirportID, DepartureTime, ArrivalTime, AircraftID)
       VALUES (%s, %s, %s, %s, %s, %s, %s);
    """

    try:
        # Try executing the SQL and adding the flight to the database
        cur.execute(sql, (flight_id, flight_number, departure_airport_id, arrival_airport_id, departure_time, arrival_time, aircraft_id))
        
        conn.commit()  # Commit the transaction
        print("Flight added successfully.")
    except Exception as e:
        # If there were any errors, print an error to the debug
        print("Unexpected error adding a flight:", e)
        raise
    finally:
        cur.close()  # Close the cursor
        conn.close()  # Close the connection to the database


# Update fields for a particular flight
def update_flight_in_db(flight_id, flight_number, departure_airport_id, arrival_airport_id, departure_time, arrival_time, aircraft_id):
    conn = database_connect()
    if conn is None:
        print("Database connection failed.")
        return False
    
    try:
        cur = conn.cursor()
        sql = """
            UPDATE Flights
            SET FlightNumber = %s,
                DepartureAirportID = %s,
                ArrivalAirportID = %s,
                DepartureTime = %s,
                ArrivalTime = %s,
                AircraftID = %s
            WHERE FlightID = %s  -- Ensure this matches the correct column name
        """
        cur.execute(sql, (flight_number, departure_airport_id, arrival_airport_id, departure_time, arrival_time, aircraft_id, flight_id))
        conn.commit()
        return cur.rowcount > 0  # Returns True if at least one row was updated
    except Exception as e:
        print(f"Error updating flight: {e}")
        return False
    finally:
        cur.close()
        conn.close()





def get_flights_paginated(page, per_page):
    # Offset
    offset = (page - 1) * per_page

    # Query to get the flights for the current page
    query = """
        SELECT FlightID, FlightNumber, DepartureAirportID, ArrivalAirportID,
               DepartureTime, ArrivalTime, AircraftID
        FROM flights
        ORDER BY flightid
        LIMIT %s OFFSET %s;
    """
    conn = database_connect()
    if conn is None:
        return None

    cur = conn.cursor()
    cur.execute(query, (per_page, offset))
    flights = cur.fetchall()

    return flights

def get_total_flights_count():
    # Query to get the total number of flights
    query = "SELECT COUNT(*) FROM flights;"
    conn = database_connect()
    if conn is None:
        return None

    cur = conn.cursor()
    cur.execute(query)
    total_flights = cur.fetchone()[0]

    return total_flights


def get_flights_summary_by_airport():
    """
    Retrieve a summary of the number of flights that have departed from each airport.
    Returns a list of tuples containing (airport_id, number_of_flights).
    """
    conn = database_connect()  
    if conn is None:
        return []

    cur = conn.cursor()
    sql = """
        SELECT arrivalairportid, COUNT(*) AS number_of_flights 
        FROM flights 
        GROUP BY arrivalairportid;
    """
    try:
        cur.execute(sql)
        summary = cur.fetchall()  # Fetch all results
        return summary  # Return the summary as a list of tuples
    except Exception as e:
        print("Unexpected error fetching flights summary by airport:", e)
        return []  # Return an empty list in case of an error
    finally:
        cur.close()  # Close the cursor
        conn.close()  # Close the connection to the database

def remove_flight_by_id(flight_id):
    """
    Remove a flight from the database given its flight ID.
    """
    conn = database_connect()  # Ensure you have a function to connect to your database
    if conn is None:
        print("Connection to the database failed.")
        return None

    cur = conn.cursor()
    sql = "DELETE FROM Flights WHERE FlightID = %s;"

    try:
        print(f"Attempting to remove flight with ID: {flight_id}")  # Debugging line
        cur.execute(sql, (flight_id,))  # Execute the SQL command
        if cur.rowcount == 0:
            print(f"No flight found with ID: {flight_id}")  # Debugging line
        else:
            print(f"Flight with ID {flight_id} removed successfully.")  # Debugging line
        
        conn.commit()  # Commit the transaction
    except Exception as e:
        print("Error removing flight:", e)  # Print the error
        raise
    finally:
        cur.close()  # Close the cursor
        conn.close()  # Close the connection


def remove_tickets_by_flight_id(flight_id):
    conn = database_connect()
    if conn is None:
        raise Exception("Database connection error.")

    cur = conn.cursor()
    sql = "DELETE FROM tickets WHERE flightid = %s;"

    try:
        cur.execute(sql, (flight_id,))
        conn.commit()  # Commit the transaction
        return cur.rowcount  # Return the number of rows affected
    except Exception as e:
        print("Error removing tickets:", e)
        raise
    finally:
        cur.close()
        conn.close()





