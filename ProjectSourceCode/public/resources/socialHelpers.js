export async function getChallengeFromUsers(db, userUsername, friendUsername) {
    const queryChallengeExists = `SELECT * FROM challenge 
    WHERE ( (user_username = $1 AND friend_username = $2) OR (user_username = $2 AND friend_username = $1) );`
    const challenge = await db.oneOrNone(queryChallengeExists, [userUsername, friendUsername]);

    return challenge;
}
export async function getAllFriends(db, username) {
    const recievedFriendsQuery = `SELECT u.username, u.first_name, u.last_name, f.user_wins, f.friend_wins, f.ties FROM friends f 
    JOIN users u ON u.username = f.user_username WHERE f.friend_username = $1 AND f.status = 'accepted'`;
    const sentFriendsQuery = `SELECT u.username, u.first_name, u.last_name, f.user_wins, f.friend_wins, f.ties FROM friends f 
    JOIN users u ON u.username = f.friend_username WHERE f.user_username = $1 AND f.status = 'accepted'`;

    // Get friends who initially sent the friend request, then get friends who initially recieved the request, then combine
    const received = await db.any(recievedFriendsQuery, [username]);

    // Switch order of wins
    for(let i = 0; i < received.length; i++){
        const temp = received[i].user_wins;
        received[i].user_wins = received[i].friend_wins;
        received[i].friend_wins = temp;
    }
    const sent = await db.any(sentFriendsQuery, [username]);
    const friends = [...received, ...sent];

    for(let i = 0; i < friends.length; i++){
        const challenge = await getChallengeFromUsers(db, friends[i].username, username);
        let challengeStatus = "none";
        console.log(challenge, friends[i]);
        if(challenge){
            
            // If pending and is sent from user set status to pending otherwise accept
            if(challenge.status === "pending"){
                if(challenge.user_username === username){
                    challengeStatus = "pending";
                }
                else{
                    challengeStatus = "accept";
                }
            }
            else if(challenge.status === "play"){
                challengeStatus = "play";
            }
            else if(challenge.status === "waiting_friend"){
                if(challenge.user_username === username){
                    challengeStatus = "waiting";
                }
                else{
                    challengeStatus = "play";
                }
            }
            else{
                if(challenge.user_username === username){
                    challengeStatus = "play";
                }
                else{
                    challengeStatus = "waiting";
                }
            }
            
        }

        friends[i][challengeStatus] = true;    
    }
    return friends;
}