import React from 'react';
import Valine from "gatsby-plugin-valine";

const Comment = ({slug}) => {
    return <Valine path={slug} visitor={true}/>
}
export default Comment;
