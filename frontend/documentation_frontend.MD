Install Expo Go on mobile phone.

To run your project, navigate to the directory and run one of the following npm commands.

- cd waypoint
- npm run android
- npm run ios # you need to use macOS to build the iOS project - use the Expo app if you need to do iOS development without a Mac
- npm run web
- npm start (what you should use)


utils.js

- storeData(key, value): 
	Stores value at a key
	Returns {error: status, message: message}

- getData(key): 
	Gets value stored at key
	returns {error: status, data: value (if not error), message: message}

- removeData(key): 
	Deletes value stored at key
	returns {error: status, message: message}

- getRequest(address): 
	Sends a get request to the backend at a given address
	Returns {error: status, data: data (if not error), message: message}

- postRequest(address, data={}):
	Sends a post request to the backend at a given address, with data. Data does not need to be given to work
	Returns {error: status, data: data (if not error), message: message}

- reqSocket(userID, partyID): (work in progress)
	Joins a party and has sockets, not fully implemented
	returns Nothing


mapUtil.js

- getDistance(latitude1, longitude1, latitude2, longitude2):
	Uses haversine formula to calculate distance between 2 coordinate points
	Returns a float (distance in meters)

- getNearbyPlaces(latitude, longitude):
	Calls backend to get nearby places from google maps API, returns list of places with coordinates
	Returns {error: status, data: data (if not error), message: message}

userUtils.js

- getUserFriends(username):
	Gets user's friends, returns list of usernames with cardID
	Returns {error: status, data: {username: string, cardID: int} (if not error), message: message}

- getUsers(prompt):
	Searches for users with prompt, returns list of usernames
	Returns {error: status, data: data (if not error), message: message}
