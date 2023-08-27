module.exports = {
    groupNameHasExist: (res) => {
        res.status(400).json({ error: 'Client error - groupNameHasExist' });
    },
    alreadyMember: (res) => {
        res.status(400).json({ error: 'Client error - alreadyMember' });
    },
    groupNotExist: (res) => {
        res.status(400).json({ error: 'Client error - groupNotExist' });
    },
    cannotPending: (res) => {
        res.status(400).json({ error: 'Client error - you have no right' });
    },
    cannotDeleteGroup: (res) => {
        res.status(400).json({ error: 'Client error - no right / group doesn\'t exist ' });
    },
    cannotJoin: (res) => {
        res.status(400).json({ error: 'Client error - you are founder / group doesn\'t exist / you have joined this group' });
    },
    noComment: (res) => {
        res.status(400).json({ error: 'Client error - no comments in this post' });
    },
    cannotSaveImg: (res) => {
        res.status(400).json({ error: 'Client error - Image error' });
    },
    noPendingFriendship: (res) => {
        res.status(400).json({ error: 'Client error -  no pending ' });
    },
    input: (res) => {
        res.status(400).json({ error: 'Client error - input feild should not be empty' });
    },
    emailFormat: (res) => {
        res.status(400).json({ error: 'Client error - email format is not valid' });
    },
    contentType: (res) => {
        res.status(400).json({ error: 'Content type is not correct' });
    },
    noFriendRequestYourself: (res) => {
        res.status(400).json({ error: 'Cannot send friend request to yourself' });
    },
    isAlreadyFriend: (res) => {
        res.status(400).json({ error: 'They are already friends' });
    },
    requestBetweenExist: (res) => {
        res.status(400).json({ error: 'They already sent request friend between' });
    },
    cannotAgree: (res) => {
        res.status(400).json({ error: 'The friendship is not exist/ You are not receiver/ The status is wrong' });
    },
    friendshipNotExist: (res) => {
        res.status(400).json({ error: 'The friendship is not exist' });
    },
    eventNotExist: (res) => {
        res.status(400).json({ error: 'The event is not exist' });
    },
    cannotDelete: (res) => {
        res.status(400).json({ error: 'You are not permitted to delete friendship' });
    },
    cannotRead: (res) => {
        res.status(400).json({ error: 'Event is not exist/ You are not receiver/ It is already read' });
    },
    cannotUpdatePost: (res) => {
        res.status(400).json({ error: 'Post is not exist/ You are not the author' });
    },
    alreadyLike: (res) => {
        res.status(400).json({ error: 'You have already liked this post before' });
    },
    hasNotLiked: (res) => {
        res.status(400).json({ error: 'You have not liked this post before' });
    },
    postNotExist: (res) => {
        res.status(400).json({ error: 'Post is not exist' });
    },
    noToken: (res) => {
        res.status(401).json({ error: 'Client error - no token' })
    },
    emailExist: (res) => {
        res.status(403).json({ error: 'Email already exists' });
    },
    userNotFound: (res) => {
        res.status(403).json({ error: 'user not found' });
    },
    wrongPassword: (res) => {
        res.status(403).json({ error: 'Sign In Failed - wrong password' });
    },
    wrongProvider: (res) => {
        res.status(403).json({ error: 'Sign In Failed - wrong provider' });
    },
    wrongToken: (res) => {
        res.status(403).json({ error: 'Wrong token' });
    },
    noToken: (res) => {
        res.status(401).json({ error: 'No token' });
    },
    dbConnection: (res) => {
        res.status(500).json({ error: 'Server error - connecting to db failed' });
    },
    query: (res) => {
        res.status(500).json({ error: 'Server error - query failed' });
    }
}
