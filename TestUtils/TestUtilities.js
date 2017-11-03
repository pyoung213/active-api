export default {
    letAsyncHappen
};

function letAsyncHappen() {
    return new Promise((resolve) => {
        setTimeout(resolve, 0);
    });
}
