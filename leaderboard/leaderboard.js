//The two API calls store the data in these variables.
//This is so it doesn't have to do a new call each time
//the list is sorted.
//
//The api is broken and a new one hasn't
//been built yet.
var last30days = {};
var top100 = {};
var tdHeight = '50px'; //change in CSS also - image & tr height

//make a tag for each user with slots for the
//info from the stored objects
var User = React.createClass({
  render: function() {
    console.log(tdHeight);
    return (
      <tr>
        <td className="rank"><div className="data">{this.props.rank}</div></td>
        <td id="userName" style={
            {backgroundImage: 'url(' + this.props.image + ')',
              backgroundSize: tdHeight, 
                backgroundRepeat: 'no-repeat'}
                                }>
          <div className="tdOverlay panel panel-default">
            <a href={"https://freecodecamp.com/" + this.props.name} target="_blank">
              {this.props.name}
            </a>
          </div>
        </td>
        <td><div className="data">{this.props.last30}</div></td>
        <td><div className="data">{this.props.alltime}</div></td>
      </tr>      
    );
  }
});

//Loop through and add an entry for each user.
//This will be the main readerboard.
//The byTop30 state toggles which set of data
//to display.
var List = React.createClass({
  getInitialState: function() {
    return {byTop100: false};
  },
  
  sortByLast30: function() {
    this.setState({byTop100: false});
  },
  
  sortByAllTime: function() {
    this.setState({byTop100: true});
  },
  
  //Only build table after data is received
  componentWillMount: function() {
    //load data and build an array for each
    $.ajax({   //get the best from the last 30 days
      type: "GET",
      url: "https://fcctop100.herokuapp.com/api/fccusers/top/recent",
      contentType: "application/json; charset=utf-8",
      async: false,
      dataType: "json",
      success: function(data) {
        last30days = $.extend(true, [], data); //deep copy received data from {} to []
      },
      error: function() {
        console.log("couldn't get data");
      }
    });
    
    $.ajax({    //get the all-time top 100
      type: "GET",
      url: "https://fcctop100.herokuapp.com/api/fccusers/top/alltime",
      contentType: "application/json; charset=utf-8",
      async: false,
      dataType: "json",
      success: function(data) {
        top100 = $.extend(true, [], data); //deep copy received data from {} to []
      },
      error: function() {
        console.log("couldn't get data");
      }
    });
  },
  
  render: function() {
    //sortBy is a reference to either top100 or last30days arrays
    //theList is the user list
    var theList = [], sortBy = []; 
    if(this.state.byTop100 === true) sortBy = top100;
    else sortBy = last30days;
    //add entry for each user
    for(var i = 0, len = sortBy.length; i < len; ++i) {
      theList.push(<User rank={i+1} 
                         image={sortBy[i]["img"]}
                         name={sortBy[i]["username"]} 
                         last30={sortBy[i]["recent"]} 
                         alltime={sortBy[i]["alltime"]} />
                  );
    }
    //Couldn't find a simpler way to do this. Open & close JSX tags have to go together.
    return (<div>    
              <table className="table table-hover table-condensed">
                <caption id="title">FCCers by brownie points</caption>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th><a href='#' onClick={this.sortByLast30}>Last 30 Days</a></th>
                    <th><a href='#' onClick={this.sortByAllTime}>All-time</a></th>
                  </tr>
                </thead>
                <tbody>
                  {theList}
                </tbody>
              </table>
            </div>
           );
  }
});

ReactDOM.render(<List />, document.getElementById("table"));
