import React from 'react';
import { Col, Container, Row } from 'react-bootstrap';

class Log extends React.Component<{}, {}> {
    constructor(props: any) {
        super(props);
    }

    render() {
        return (
            <div className='container-bg'>
              <Container>
                <Row lg={12}>
                  yoyoyoyoo
                </Row>
              </Container>
            </div>
        );
    }
}

export default Log;