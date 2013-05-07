
function VoterCtrl($scope) {

    $scope.visible=true;

    window.mazeClient.client.on('WaitingRoom.PlayerCountChanged', function (data) {
        $scope.playersInWaitingRoom = data;
        $scope.$apply();
    });
    window.mazeClient.client.on('WaitingRoom.VoteStartChanged', function (data) {
        $scope.playersVotedToStart = data;
        $scope.$apply();
    });
    window.mazeClient.client.on('WaitingRoom.GameBeginning', function (data) {
        swingAway();
        $scope.visible=false;
        $scope.$apply();

    });

    $scope.windowVisible=function(){
        return {'display':($scope.visible?'block':'none')};
    };

    $scope.playersInWaitingRoom=0;
    $scope.playersVotedToStart = 0;
    $scope.voted = false;
        
    $scope.voteToStart = function () {
        $scope.voted = !$scope.voted;
        window.mazeClient.client.emit('WaitingRoom.VoteStart', $scope.voted);
    };

}

function swingAway() {
}