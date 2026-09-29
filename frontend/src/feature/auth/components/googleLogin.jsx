import { GoogleLogin as GooglLoginButton } from "@react-oauth/google"


const GoogleLogin = ({ onSuccess, onError }) => {
    

    return (
        <GooglLoginButton
            onSuccess={onSuccess}
            onError={onError}
        />
    )
}

export default GoogleLogin;