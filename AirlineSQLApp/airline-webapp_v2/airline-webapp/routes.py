# Importing the Flask Framework
from flask import *
import database
import configparser


# appsetup

page = {}
session = {}

# Initialise the FLASK application
app = Flask(__name__)
app.secret_key = 'SoMeSeCrEtKeYhErE'


# Debug = true if you want debug output on error ; change to false if you dont
app.debug = True


# Read my unikey to show me a personalised app
config = configparser.ConfigParser()
config.read('config.ini')
dbuser = config['DATABASE']['user']
portchoice = config['FLASK']['port']
if portchoice == '10000':
    print('ERROR: Please change config.ini as in the comments or Lab instructions')
    exit(0)

session['isadmin'] = False

###########################################################################################
###########################################################################################
####                                 Database operative routes                         ####
###########################################################################################
###########################################################################################



#####################################################
##  INDEX
#####################################################

# What happens when we go to our website (home page)
@app.route('/')
def index():
    # If the user is not logged in, then make them go to the login page
    if( 'logged_in' not in session or not session['logged_in']):
        return redirect(url_for('login'))
    page['username'] = dbuser
    page['title'] = 'Welcome'
    return render_template('welcome.html', session=session, page=page)

#####################################################
# User Login related                        
#####################################################
# login
@app.route('/login', methods=['POST', 'GET'])
def login():
    page = {'title' : 'Login', 'dbuser' : dbuser}
    # If it's a post method handle it nicely
    if(request.method == 'POST'):
        # Get our login value
        val = database.check_login(request.form['userid'], request.form['password'])
        print(val)
        print(request.form)
        # If our database connection gave back an error
        if(val == None):
            errortext = "Error with the database connection."
            errortext += "Please check your terminal and make sure you updated your INI files."
            flash(errortext)
            return redirect(url_for('login'))

        # If it's null, or nothing came up, flash a message saying error
        # And make them go back to the login screen
        if(val is None or len(val) < 1):
            flash('There was an error logging you in')
            return redirect(url_for('login'))

        # If it was successful, then we can log them in :)
        print(val[0])
        session['name'] = val[0]['firstname']
        session['userid'] = request.form['userid']
        session['logged_in'] = True
        session['isadmin'] = val[0]['isadmin']
        return redirect(url_for('index'))
    else:
        # Else, they're just looking at the page :)
        if('logged_in' in session and session['logged_in'] == True):
            return redirect(url_for('index'))
        return render_template('index.html', page=page)

# logout
@app.route('/logout')
def logout():
    session['logged_in'] = False
    flash('You have been logged out')
    return redirect(url_for('index'))



########################
#List All Items#
########################

@app.route('/users')
def list_users():
    '''
    List all rows in users by calling the relvant database calls and pushing to the appropriate template
    '''
    # connect to the database and call the relevant function
    users_listdict = database.list_users()

    # Handle the null condition
    if (users_listdict is None):
        # Create an empty list and show error message
        users_listdict = []
        flash('Error, there are no rows in users')
    page['title'] = 'List Contents of users'
    return render_template('list_users.html', page=page, session=session, users=users_listdict)
    

########################
#List Single Items#
########################


@app.route('/users/<userid>')
def list_single_users(userid):
    '''
    List all rows in users that match a particular id attribute userid by calling the 
    relevant database calls and pushing to the appropriate template
    '''

    # connect to the database and call the relevant function
    users_listdict = None
    users_listdict = database.list_users_equifilter("userid", userid)

    # Handle the null condition
    if (users_listdict is None or len(users_listdict) == 0):
        # Create an empty list and show error message
        users_listdict = []
        flash('Error, there are no rows in users that match the attribute "userid" for the value '+userid)
    page['title'] = 'List Single userid for users'
    return render_template('list_users.html', page=page, session=session, users=users_listdict)


########################
#List Search Items#
########################

@app.route('/consolidated/users')
def list_consolidated_users():
    '''
    List all rows in users join userroles 
    by calling the relvant database calls and pushing to the appropriate template
    '''
    # connect to the database and call the relevant function
    users_userroles_listdict = database.list_consolidated_users()

    # Handle the null condition
    if (users_userroles_listdict is None):
        # Create an empty list and show error message
        users_userroles_listdict = []
        flash('Error, there are no rows in users_userroles_listdict')
    page['title'] = 'List Contents of Users join Userroles'
    return render_template('list_consolidated_users.html', page=page, session=session, users=users_userroles_listdict)

@app.route('/user_stats')
def list_user_stats():
    '''
    List some user stats
    '''
    # connect to the database and call the relevant function
    user_stats = database.list_user_stats()

    # Handle the null condition
    if (user_stats is None):
        # Create an empty list and show error message
        user_stats = []
        flash('Error, there are no rows in user_stats')
    page['title'] = 'User Stats'
    return render_template('list_user_stats.html', page=page, session=session, users=user_stats)

@app.route('/users/search', methods=['POST', 'GET'])
def search_users_byname():
    '''
    List all rows in users that match a particular name
    by calling the relevant database calls and pushing to the appropriate template
    '''
    if(request.method == 'POST'):

        search = database.search_users_customfilter(request.form['searchfield'],"~",request.form['searchterm'])
        print(search)
        
        users_listdict = None

        if search == None:
            errortext = "Error with the database connection."
            errortext += "Please check your terminal and make sure you updated your INI files."
            flash(errortext)
            return redirect(url_for('index'))
        if search == None or len(search) < 1:
            flash(f"No items found for search: {request.form['searchfield']}, {request.form['searchterm']}")
            return redirect(url_for('index'))
        else:
            
            users_listdict = search
            # Handle the null condition'
            print(users_listdict)
            if (users_listdict is None or len(users_listdict) == 0):
                # Create an empty list and show error message
                users_listdict = []
                flash('Error, there are no rows in users that match the searchterm '+request.form['searchterm'])
            page['title'] = 'Users search by name'
            return render_template('list_users.html', page=page, session=session, users=users_listdict)
            

    else:
        return render_template('search_users.html', page=page, session=session)
        
@app.route('/users/delete/<userid>')
def delete_user(userid):
    '''
    Delete a user
    '''
    # connect to the database and call the relevant function
    resultval = database.delete_user(userid)
    
    page['title'] = f'List users after user {userid} has been deleted'
    return redirect(url_for('list_consolidated_users'))
    
@app.route('/users/update', methods=['POST','GET'])
def update_user():
    """
    Update details for a user
    """
    # # Check if the user is logged in, if not: back to login.
    if('logged_in' not in session or not session['logged_in']):
        return redirect(url_for('login'))
    
    # Need a check for isAdmin

    page['title'] = 'Update user details'

    userslist = None

    print("request form is:")
    newdict = {}
    print(request.form)

    validupdate = False
    # Check your incoming parameters
    if(request.method == 'POST'):

        # verify that at least one value is available:
        if ('userid' not in request.form):
            # should be an exit condition
            flash("Can not update without a userid")
            return redirect(url_for('list_users'))
        else:
            newdict['userid'] = request.form['userid']
            print("We have a value: ",newdict['userid'])

        if ('firstname' not in request.form):
            newdict['firstname'] = None
        else:
            validupdate = True
            newdict['firstname'] = request.form['firstname']
            print("We have a value: ",newdict['firstname'])

        if ('lastname' not in request.form):
            newdict['lastname'] = None
        else:
            validupdate = True
            newdict['lastname'] = request.form['lastname']
            print("We have a value: ",newdict['lastname'])

        if ('userroleid' not in request.form):
            newdict['userroleid'] = None
        else:
            validupdate = True
            newdict['userroleid'] = request.form['userroleid']
            print("We have a value: ",newdict['userroleid'])

        if ('password' not in request.form):
            newdict['password'] = None
        else:
            validupdate = True
            newdict['password'] = request.form['password']
            print("We have a value: ",newdict['password'])

        print('Update dict is:')
        print(newdict, validupdate)

        if validupdate:
            #forward to the database to manage update
            userslist = database.update_single_user(newdict['userid'],newdict['firstname'],newdict['lastname'],newdict['userroleid'],newdict['password'])
        else:
            # no updates
            flash("No updated values for user with userid")
            return redirect(url_for('list_users'))
        # Should redirect to your newly updated user
        return list_single_users(newdict['userid'])
    else:
        return redirect(url_for('list_consolidated_users'))

######
## Edit user
######
@app.route('/users/edit/<userid>', methods=['POST','GET'])
def edit_user(userid):
    """
    Edit a user
    """
    # # Check if the user is logged in, if not: back to login.
    if('logged_in' not in session or not session['logged_in']):
        return redirect(url_for('login'))
    
    # Need a check for isAdmin

    page['title'] = 'Edit user details'

    users_listdict = None
    users_listdict = database.list_users_equifilter("userid", userid)

    # Handle the null condition
    if (users_listdict is None or len(users_listdict) == 0):
        # Create an empty list and show error message
        users_listdict = []
        flash('Error, there are no rows in users that match the attribute "userid" for the value '+userid)

    userslist = None
    print("request form is:")
    newdict = {}
    print(request.form)
    user = users_listdict[0]
    validupdate = False

    # Check your incoming parameters
    if(request.method == 'POST'):

        # verify that at least one value is available:
        if ('userid' not in request.form):
            # should be an exit condition
            flash("Can not update without a userid")
            return redirect(url_for('list_users'))
        else:
            newdict['userid'] = request.form['userid']
            print("We have a value: ",newdict['userid'])

        if ('firstname' not in request.form):
            newdict['firstname'] = None
        else:
            validupdate = True
            newdict['firstname'] = request.form['firstname']
            print("We have a value: ",newdict['firstname'])

        if ('lastname' not in request.form):
            newdict['lastname'] = None
        else:
            validupdate = True
            newdict['lastname'] = request.form['lastname']
            print("We have a value: ",newdict['lastname'])

        if ('userroleid' not in request.form):
            newdict['userroleid'] = None
        else:
            validupdate = True
            newdict['userroleid'] = request.form['userroleid']
            print("We have a value: ",newdict['userroleid'])

        if ('password' not in request.form):
            newdict['password'] = None
        else:
            validupdate = True
            newdict['password'] = request.form['password']
            print("We have a value: ",newdict['password'])

        print('Update dict is:')
        print(newdict, validupdate)

        if validupdate:
            #forward to the database to manage update
            userslist = database.update_single_user(newdict['userid'],newdict['firstname'],newdict['lastname'],newdict['userroleid'],newdict['password'])
        else:
            # no updates
            flash("No updated values for user with userid")
            return redirect(url_for('list_users'))
        # Should redirect to your newly updated user
        return list_single_users(newdict['userid'])
    else:
        # assuming GET request, need to setup for this
        return render_template('edit_user.html',
                           session=session,
                           page=page,
                           userroles=database.list_userroles(),
                           user=user)


######
## add items
######
    
@app.route('/users/add', methods=['POST','GET'])
def add_user():
    """
    Add a new User
    """
    # # Check if the user is logged in, if not: back to login.
    if('logged_in' not in session or not session['logged_in']):
        return redirect(url_for('login'))
    
    # Need a check for isAdmin

    page['title'] = 'Add user details'

    userslist = None
    print("request form is:")
    newdict = {}
    print(request.form)

    # Check your incoming parameters
    if(request.method == 'POST'):

        # verify that all values are available:
        if ('userid' not in request.form):
            # should be an exit condition
            flash("Can not add user without a userid")
            return redirect(url_for('add_user'))
        else:
            newdict['userid'] = request.form['userid']
            print("We have a value: ",newdict['userid'])

        if ('firstname' not in request.form):
            newdict['firstname'] = 'Empty firstname'
        else:
            newdict['firstname'] = request.form['firstname']
            print("We have a value: ",newdict['firstname'])

        if ('lastname' not in request.form):
            newdict['lastname'] = 'Empty lastname'
        else:
            newdict['lastname'] = request.form['lastname']
            print("We have a value: ",newdict['lastname'])

        if ('userroleid' not in request.form):
            newdict['userroleid'] = 1 # default is traveler
        else:
            newdict['userroleid'] = request.form['userroleid']
            print("We have a value: ",newdict['userroleid'])

        if ('password' not in request.form):
            newdict['password'] = 'blank'
        else:
            newdict['password'] = request.form['password']
            print("We have a value: ",newdict['password'])

        print('Insert parametesrs are:')
        print(newdict)

        database.add_user_insert(newdict['userid'], newdict['firstname'],newdict['lastname'],newdict['userroleid'],newdict['password'])
        # Should redirect to your newly updated user
        print("did it go wrong here?")
        return redirect(url_for('list_consolidated_users'))
    else:
        # assuming GET request, need to setup for this
        return render_template('add_user.html',
                           session=session,
                           page=page,
                           userroles=database.list_userroles())
    


@app.route('/flights', methods=['GET'])
def show_all_flights_route():
    try:
        # Get page number
        page = request.args.get('page', 1, type=int)
        if page < 1:
            page = 1  # Ensure the page number is at least 1
        per_page = 20  # Number of flights per page

        # Fetch flights
        flights = database.get_flights_paginated(page, per_page)
        total_flights = database.get_total_flights_count()

        if flights:
            return render_template(
                'all_flights.html', 
                flights=flights, 
                page=page, 
                total_flights=total_flights, 
                per_page=per_page
            )
        else:
            print(f"No flights found for page {page}")
            return jsonify({'error': 'No flights found'}), 404
    except Exception as e:
        print(f"Error occurred: {str(e)}")  # Log the error for debugging
        return jsonify({'error': 'An unexpected error occurred. Please try again later.'}), 500

@app.route('/show_flight_by_id', methods=['GET'])
def show_flight_by_id_route():
    flight_id = request.args.get('flight_id')
    flight = None
    invalid_id = False

    if flight_id:
        try:
            flight_id_int = int(flight_id)
            if flight_id_int <0 or flight_id_int > 2147483647:
                invalid_id = True
            else:
                flight = database.get_flight_by_id(flight_id_int)
                if not flight:
                    invalid_id = True

        except ValueError:
            invalid_id = True
    return render_template('show_flight_by_id.html', flight = flight, flight_id = flight_id, page = {'title': 'Flight Details'}, invalid_id = invalid_id)



@app.route('/flights/add', methods=['GET', 'POST'])
def add_new_flight_route():
    page = {'title': 'Add New Flight'}

    if request.method == 'POST':
        try:
            # Extract data from the form submission
            flight_id = request.form.get('flight_id')
            flight_number = request.form.get('flight_number')
            departure_airport_id = request.form.get('departure_airport_id')
            arrival_airport_id = request.form.get('arrival_airport_id')
            departure_time = request.form.get('departure_time')
            arrival_time = request.form.get('arrival_time')
            aircraft_id = request.form.get('aircraft_id')

            # Call the function to add the flight
            result = database.add_new_flight(flight_id, flight_number, departure_airport_id, arrival_airport_id, departure_time, arrival_time, aircraft_id)

            # Flash success message
            flash('Flight added successfully!', 'success')
            return redirect(url_for('show_all_flights_route'))

        except Exception as e:
            # Flash any other unexpected error messages
            flash(f"Unexpected error: {str(e)}", 'danger')
            return redirect(url_for('add_new_flight_route'))

    # Render the form to add a new flight for GET requests
    return render_template('add_flight.html', page=page)




@app.route('/remove_flight', methods=['GET', 'POST'])
def remove_flight_route():
    if request.method == 'POST':
        flight_id = request.form['flight_id']
        print(f"Received flight ID to remove: {flight_id}")

        try:
            # Attempt to remove tickets associated with the flight first
            tickets_removed = database.remove_tickets_by_flight_id(flight_id)

            if tickets_removed > 0:
                print(f"Removed {tickets_removed} tickets associated with flight ID: {flight_id}")

            # Now attempt to remove the flight
            rows_affected = database.remove_flight_by_id(flight_id)

            if rows_affected == 0:
                flash('Flight not found. Please check the flight ID.', 'danger')
            else:
                flash('Flight removed successfully!', 'success')

        except Exception as e:
            print("Error removing flight:", e)  # Log the error for debugging
            flash('Failed to remove flight. Please check the flight ID.', 'danger')

        return redirect(url_for('show_all_flights_route'))

    return render_template('remove_flight.html', page={'title': 'Remove Flight'}) 





@app.route('/flights_summary', endpoint='flights_summary')
def flights_summary():
    summary = database.get_flights_summary_by_airport()
    return render_template('flights_summary.html', summary=summary)




@app.route('/update_flight', methods=['GET', 'POST'])
def update_flight_route():
    if request.method == 'POST':
        try:
            flight_id = request.form['flight_id']
            flight_number = request.form['flight_number']
            departure_airport_id = request.form['departure_airport_id']
            arrival_airport_id = request.form['arrival_airport_id']
            departure_time = request.form['departure_time']
            arrival_time = request.form['arrival_time']
            aircraft_id = request.form['aircraft_id']

            # Ensure flight_id and other necessary fields are not empty
            if not flight_id or not flight_number or not departure_airport_id or not arrival_airport_id or \
               not departure_time or not arrival_time or not aircraft_id:
                flash('All fields must be filled out.', 'error')
                return redirect(url_for('show_all_flights_route'))

            # Proceed with updating the flight
            success = database.update_flight_in_db(flight_id, flight_number, departure_airport_id,
                                                   arrival_airport_id, departure_time, arrival_time, aircraft_id)

            if success:
                flash('Flight updated successfully!', 'success')
            else:
                flash('Failed to update flight!', 'error')

            return redirect(url_for('show_all_flights_route'))

        except Exception as e:
            print(f"Error updating flight: {e}")
            flash('An unexpected error occurred while updating the flight.', 'error')
            return redirect(url_for('show_all_flights_route'))

    flight_id = request.args.get('flight_id')
    flight = database.get_flight_by_id(flight_id)

    return render_template('update.html', flight=flight, page={'title': 'Update Flight'})



@app.route('/select_flight_to_update', methods=['GET'])
def select_flight_to_update_route():
    flights = database.show_all_flights()  # Retrieve all flights from the database
    return render_template('select_flight.html', flights=flights, page={'title': 'Select Flight to Update'})

