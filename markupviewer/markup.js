//A simple github-style markup previewer 
//using React.
//uses BABEL

marked.setOptions({
  renderer: new marked.Renderer(),
  gfm: true,
  tables: true,
  breaks: false,
  pedantic: false,
  sanitize: true,
  smartLists: true,
  smartypants: false
});

var Markup = React.createClass({
  getInitialState: function() {
    return {out: this.props.name}
  },
  translate: function() {
    this.setState({out: event.target.value});
  },
  example: function() {
    this.setState({out: "Heading \n======= \n\nSub-heading \n----------- \n\n### Another deeper heading \n\nParagraphs are separated \nby a blank line.  \n\nLeave 2 spaces at the end of a line to do a line break  \n \nText attributes *italic*, **bold**, `monospace`, ~~strikethrough~~ . \n\nShopping list: \n* apples \n* oranges \n* pears \n\nNumbered list: \n\n1. apples \n2. oranges \n3. pears  \n\nThe rain---not the reign---in Spain.  \n\n *Text borrowed from [Herman Fassett](https://freecodecamp.com/hermanfassett)*"})
  },
  clear: function() {
    this.setState({out: ""}) 
  },
  render: function() {
    var temp = this.state.out;
    if(temp !== undefined) temp = marked(temp); //error if undefined
    return(<div className="container-fluid row">
             <div className="col-xs-6">
               <textarea placeholder="github-style markup text here" value = {this.state.out} onChange={this.translate} id="input">
               </textarea>
             </div>
             <div className="col-xs-6 output" dangerouslySetInnerHTML = {{__html: temp}}></div>
        <span id="ex" onClick={this.example}>[example]</span><span id="clear" onClick={this.clear}>[clear]</span>
           </div>);
  }
});

ReactDOM.render(<Markup />, document.getElementById("outer"));
