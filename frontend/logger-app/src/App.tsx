import React from 'react';
import { Col, Container, Row } from 'react-bootstrap';
import './App.css';
import Header from './components/Header';

class App extends React.Component<{}, {}> {

    constructor(props: any) {
        super(props);
    }

    render() {
        return (
          <div>
            <Container fluid>
              <Row id="header-row" className="search-row">
                <Header channels={['sodapoppin','nyanners']} />
              </Row>
            </Container>
            <div className='container-bg'>
              <Container>
                <Row lg={12}>
                  yoyoyoyoo
                </Row>
              </Container>
            </div>
          </div>
        );
    }
}

export default App;
