# Chat Room With Cooperate Whiteboard
a chat room with cooperate whiteboard

### Used Skills
#### Version 1
* NodeJS
* jQuery
* Socket.io
* MongoDB
* Express
#### Version 2
I am going to change the jQuery to React and using ReactNative to implement the mobile client side. Using Redis instead of save hot data in RAM. Integrating the weather module into it.

### Main Function
* #### Chat Room Version 1.0 
  1. Need to login/sign in before use this.
  2. After close the browser tab this user have been logout.
  3. One user cannot login on multiple tab.
  4. Create/Join room, at first user cannot join in a certain room without that room owner's invitation.
  5. Invite friend to a room that the invite user should be the owner of the room. Any other participants have no authority to invite other user.
  6. When a new user came into a room. Load histoty message to this user.
  7. Display certain status to users like who is typing, who have joined, who have leaved.
* #### Whiteboard Version 1.0
  1. Draw image real time with other participants in the same room.
  2. Choose line color or change line width.
  3. When a new user came into a room. Load real time image which were draw by other participants.
  4. When a user want to clear the whiteboard. Over half of the online participants need to agree to clear the certain area.
* #### Char Room Version 1.1
  1. Add send and submit button for mobile device.
  2. Add close button for mobile device.
  4. Sender's message displayed on the right side of the screen.
* #### Whiteboard Version 1.1
  1. When user in default room, cooperate whiteboard cannot be used. Whiteboard could be only used as personal board that can be cleared by themselves.
  2. When the device width less than 800px. The whiteboard will be hided.


